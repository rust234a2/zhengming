/**
 * 争鸣 · 极简 WebSocket 帧编解码（RFC 6455）
 *
 * 为什么自己写：本项目零依赖（zhengming-server/package.json 无 dependencies），
 * 服务端只需要文本帧 + ping/pong + close，用不着完整实现。
 *
 * 支持：文本帧（opcode 1）、close（8）、ping（9）、pong（10）、
 *      客户端→服务端必须带掩码（RFC 要求），服务端不支持分片续帧（客户端不允许分片发消息）。
 */

import crypto from "node:crypto";

export const OPCODE = Object.freeze({
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xa,
});

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

/** 计算 Sec-WebSocket-Accept */
export function acceptKey(clientKey) {
  return crypto.createHash("sha1").update(clientKey + GUID).digest("base64");
}

/**
 * 编码一个服务端 → 客户端的帧（服务端帧不加掩码）。
 * @param {number} opcode
 * @param {Buffer|string} payload
 */
export function encodeFrame(opcode, payload = Buffer.alloc(0)) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), "utf8");
  const length = data.length;

  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  header[0] = 0x80 | opcode; // FIN = 1
  return Buffer.concat([header, data]);
}

export function encodeText(text) {
  return encodeFrame(OPCODE.TEXT, text);
}

export function encodeClose(code = 1000, reason = "") {
  const reasonBuf = Buffer.from(reason, "utf8");
  const payload = Buffer.alloc(2 + reasonBuf.length);
  payload.writeUInt16BE(code, 0);
  reasonBuf.copy(payload, 2);
  return encodeFrame(OPCODE.CLOSE, payload);
}

export function encodePong(payload) {
  return encodeFrame(OPCODE.PONG, payload || Buffer.alloc(0));
}

/**
 * 增量解析器：喂入 TCP chunk，吐出完整帧。
 * 会缓存不完整的数据；不支持分片消息（收到 continuation 帧会报错）。
 */
export class FrameParser {
  constructor({ maxPayload = 1024 * 1024 } = {}) {
    this.buffer = Buffer.alloc(0);
    this.maxPayload = maxPayload;
    this.fragments = null;
  }

  /** @returns {Array<{opcode:number, payload:Buffer, text?:string}>} */
  push(chunk) {
    this.buffer = this.buffer.length ? Buffer.concat([this.buffer, chunk]) : chunk;
    const frames = [];

    while (this.buffer.length >= 2) {
      const b0 = this.buffer[0];
      const b1 = this.buffer[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let length = b1 & 0x7f;
      let offset = 2;

      if (length === 126) {
        if (this.buffer.length < offset + 2) break;
        length = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (length === 127) {
        if (this.buffer.length < offset + 8) break;
        const big = this.buffer.readBigUInt64BE(offset);
        if (big > BigInt(this.maxPayload)) throw new Error("frame payload too large");
        length = Number(big);
        offset += 8;
      }

      if (length > this.maxPayload) throw new Error("frame payload too large");

      let maskKey = null;
      if (masked) {
        if (this.buffer.length < offset + 4) break;
        maskKey = this.buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      if (this.buffer.length < offset + length) break;

      const raw = this.buffer.subarray(offset, offset + length);
      const payload = Buffer.from(raw);
      if (maskKey) {
        for (let i = 0; i < payload.length; i += 1) payload[i] ^= maskKey[i % 4];
      }
      this.buffer = this.buffer.subarray(offset + length);

      // 控制帧不能分片
      if (opcode === OPCODE.CLOSE || opcode === OPCODE.PING || opcode === OPCODE.PONG) {
        frames.push({ opcode, payload });
        continue;
      }

      if (opcode === OPCODE.CONTINUATION) {
        throw new Error("fragmented messages are not supported");
      }

      if (!fin) {
        throw new Error("fragmented messages are not supported");
      }

      frames.push({
        opcode,
        payload,
        text: opcode === OPCODE.TEXT ? payload.toString("utf8") : undefined,
      });
    }

    return frames;
  }
}
