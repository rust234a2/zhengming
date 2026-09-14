/**
 * S2/S3 衔接验收：用真实 WebSocket 客户端跑完一场完整对局。
 *
 * 这不是单测，是集成冒烟脚本——用来验证：
 *   服务端加载领域模块 → 两个客户端开房 → 五阶段全部走通 → 报告落盘可回读
 *
 * 用法：node zhengming-server/test/e2e-room.mjs
 */

import net from "node:net";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { createServer } from "../server.mjs";
import { OPCODE, FrameParser } from "../lib/ws.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const useRealHost = process.argv.includes("--real-host") || process.env.ZHENGMING_E2E_REAL_HOST === "1";

async function deterministicHost(capability, params, options) {
  if (capability !== "evaluate") throw new Error(`unexpected capability in e2e: ${capability}`);
  const answers = params.transcript.filter((turn) => turn.authorId === "user" && turn.kind === "answer").length;
  return {
    ok: true,
    capability,
    requestId: options.requestId,
    result: {
      dims: { 立论: 76, 论据: 72, 逻辑: 74, 回应: 68 + answers * 6, 表达: 78, 规范: 88 },
      total: 76,
      grounds: [{ dim: "回应", quote: "回答原文", reason: `完成 ${answers} 组对应问答` }],
      verdict: "按完整发言记录生成的中立结构反馈。",
    },
  };
}

class Client {
  constructor(port) {
    this.port = port;
    this.messages = [];
    this.waiters = [];
    this.parser = new FrameParser();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.port, "127.0.0.1", () => {
        this.socket.write(
          [
            "GET /ws/room HTTP/1.1",
            `Host: 127.0.0.1:${this.port}`,
            "Upgrade: websocket",
            "Connection: Upgrade",
            "Sec-WebSocket-Key: MDEyMzQ1Njc4OWFiY2RlZg==",
            "Sec-WebSocket-Version: 13",
            "\r\n",
          ].join("\r\n"),
        );
      });
      let handshake = "";
      const onData = (chunk) => {
        handshake += chunk.toString("latin1");
        if (!handshake.includes("\r\n\r\n")) return;
        if (!/101/.test(handshake.split("\r\n")[0])) {
          reject(new Error(handshake.split("\r\n")[0]));
          return;
        }
        this.socket.off("data", onData);
        this.socket.on("data", (c) => this.#onFrames(c));
        resolve(this);
      };
      this.socket.on("data", onData);
      this.socket.on("error", reject);
    });
  }

  #onFrames(chunk) {
    for (const frame of this.parser.push(chunk)) {
      if (frame.opcode !== OPCODE.TEXT) continue;
      const msg = JSON.parse(frame.text);
      this.messages.push(msg);
      for (let i = this.waiters.length - 1; i >= 0; i -= 1) {
        if (this.waiters[i](msg)) this.waiters.splice(i, 1);
      }
    }
  }

  send(obj) {
    const payload = Buffer.from(JSON.stringify(obj), "utf8");
    const mask = Buffer.from([9, 8, 7, 6]);
    for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
    let header;
    if (payload.length < 126) {
      header = Buffer.alloc(2);
      header[1] = 0x80 | payload.length;
    } else {
      header = Buffer.alloc(4);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    }
    header[0] = 0x80 | OPCODE.TEXT;
    this.socket.write(Buffer.concat([header, mask, payload]));
  }

  waitFor(predicate, timeout = 4000) {
    const hit = this.messages.find(predicate);
    if (hit) return Promise.resolve(hit);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout; last state: ${JSON.stringify(this.lastState()?.phase)}`)), timeout);
      const check = (msg) => {
        if (!predicate(msg)) return false;
        clearTimeout(timer);
        resolve(msg);
        return true;
      };
      this.waiters.push(check);
    });
  }

  /** 最近一次权威快照 */
  lastState() {
    for (let i = this.messages.length - 1; i >= 0; i -= 1) {
      if (this.messages[i].type === "state") return this.messages[i].state;
    }
    return null;
  }

  /** 等状态满足条件 */
  waitState(predicate, timeout = 4000) {
    return this.waitFor((m) => m.type === "state" && predicate(m.state), timeout).then((m) => m.state);
  }

  close() {
    if (this.socket && !this.socket.destroyed) this.socket.destroy();
  }
}

const log = (...args) => console.log(...args);
const step = (n, text) => log(`\n[${n}] ${text}`);

async function main() {
  const storeDir = await fs.mkdtemp(path.join(os.tmpdir(), "zm-e2e-"));
  const ctx = await createServer({
    port: 0,
    storeDir,
    hostInvoker: useRealHost ? undefined : deterministicHost,
  });
  await new Promise((resolve) => ctx.server.listen(0, "127.0.0.1", resolve));
  const port = ctx.server.address().port;

  log(`服务端口 ${port}`);
  log(`领域模块: ${ctx.domainSource || "缺失"}`);
  log(`终局评分: ${useRealHost ? "StepFun 真实上游" : "确定性测试替身"}`);
  log(`议题数: ${ctx.topics.length}（成对 ${ctx.topics.filter((t) => t.paired).length}）`);
  if (!ctx.domainSource) {
    log("！！领域模块未加载，后续动作会被拒");
    await ctx.close();
    process.exit(1);
  }

  const roomId = "e2e-room-1";
  const pro = await new Client(port).connect();
  const con = await new Client(port).connect();

  step(1, "两个客户端 join");
  pro.send({ type: "join", roomId, side: "pro", name: "甲方" });
  const joinedPro = await pro.waitFor((m) => m.type === "joined");
  con.send({ type: "join", roomId, side: "con", name: "乙方" });
  const joinedCon = await con.waitFor((m) => m.type === "joined");
  log(`   pro 席位=${joinedPro.side} token=${joinedPro.seatToken.slice(0, 8)}…`);
  log(`   con 席位=${joinedCon.side} token=${joinedCon.seatToken.slice(0, 8)}…`);

  step(2, "① 立论：双方提交立论结构");
  const brief = {
    definition: "「程序员」＝以编写与维护代码为主要谋生手段的人",
    conclusion: "程序员会继续存在",
    reasons: ["需求定义无法被工具承担", "责任归属必须有人承担"],
    evidence: "近三年招聘岗位结构变化数据",
    evidenceStatus: "已提供来源",
  };
  pro.send({ type: "action", roomId, action: { kind: "submitBrief", brief } });
  await pro.waitState((s) => Boolean(s.briefs.pro));
  con.send({ type: "action", roomId, action: { kind: "submitBrief", brief: { ...brief, conclusion: "程序员这个职业会消解" } } });
  const afterBriefs = await pro.waitState((s) => Boolean(s.briefs.con));
  log(`   双方结构已登记 · phase=${afterBriefs.phase}`);

  step(3, "① 立论：双方开篇陈述");
  pro.send({ type: "action", roomId, action: { kind: "submitOpening", text: "我方标准是需求不可替代。结论是程序员会继续存在。" } });
  await con.waitState((s) => s.turnSeat === "con" && s.transcript.some((t) => t.kind === "opening"));
  con.send({ type: "action", roomId, action: { kind: "submitOpening", text: "我方标准是职能可分解。结论是职业会消解。" } });
  const afterOpening = await pro.waitState((s) => s.phase === "crossAsk" && s.turnSeat === "pro");
  log(`   双方陈述完毕 · phase=${afterOpening.phase} · 轮到 ${afterOpening.turnSeat}`);

  step(4, "② 质询轮：pro 问 → con 答 → pro 接受");
  // 注意：等待条件必须带 turnSeat——否则会命中上一阶段遗留的同名快照
  const beforeAsk1 = await pro.waitState((s) => s.phase === "crossAsk" && s.turnSeat === "pro");
  log(`   轮到 pro 提问 · 靶点=${JSON.stringify(Object.keys(pro.lastState().briefs.con))}`);
  pro.send({ type: "action", roomId, action: { kind: "ask", targetItem: "结论", question: "你说的消解，是指岗位消失还是职能转移？" } });
  await con.waitState((s) => s.phase === "crossAnswer" && s.turnSeat === "con");
  con.send({ type: "action", roomId, action: { kind: "answer", text: "我指的是岗位数量级下降，职能被并入产品角色。" } });
  await pro.waitState((s) => s.phase === "crossReact" && s.turnSeat === "pro");
  pro.send({ type: "action", roomId, action: { kind: "react", reaction: "accept" } });
  const afterCross1 = await con.waitState((s) => s.phase === "crossAsk" && s.turnSeat === "con");
  log(`   第一轮质询闭环 · 轮到 ${afterCross1.turnSeat}`);

  step(5, "② 质询轮：con 问 → pro 答 → con 追问至上限后自动推进");
  con.send({ type: "action", roomId, action: { kind: "ask", targetItem: "理由 1", question: "需求定义为什么无法被工具承担？" } });
  await pro.waitState((s) => s.phase === "crossAnswer" && s.turnSeat === "pro");
  pro.send({ type: "action", roomId, action: { kind: "answer", text: "因为需求是利益相关方协商的产物，工具只能承接已定型的表述。" } });
  await con.waitState((s) => s.phase === "crossReact" && s.turnSeat === "con");
  con.send({ type: "action", roomId, action: { kind: "react", reaction: "press" } });
  await con.waitState((s) => s.phase === "crossAsk" && s.turnSeat === "con");
  con.send({ type: "action", roomId, action: { kind: "ask", targetItem: "理由 1", question: "这些协商为何不能由工具辅助完成？" } });
  await pro.waitState((s) => s.phase === "crossAnswer" && s.turnSeat === "pro");
  pro.send({ type: "action", roomId, action: { kind: "answer", text: "工具可以辅助整理，但责任主体仍须在冲突目标之间作出取舍并承担后果。" } });
  const afterFree = await pro.waitState((s) => s.phase === "free");
  log(`   两轮质询走完 · phase=${afterFree.phase}`);

  step(6, "③ 自由对辩：pro 举证 / con 寻共识");
  pro.send({ type: "action", roomId, action: { kind: "freeSpeak", freeType: "举证", text: "举证：近三年招聘结构里需求侧岗位占比上升。" } });
  await con.waitState((s) => s.freeSpokenBy.includes("pro"));
  con.send({ type: "action", roomId, action: { kind: "freeSpeak", freeType: "寻共识", text: "我们可能都同意：纯粹敲代码的工作占比在下降。" } });
  const afterClosing = await pro.waitState((s) => s.phase === "closing");
  log(`   双方各发言一次 · phase=${afterClosing.phase}`);

  step(7, "④ 结辩：双方提交，pro 附带修正");
  pro.send({
    type: "action",
    roomId,
    action: {
      kind: "submitClosing",
      text: "分歧在职能能否被完全外包给工具。按我的标准，结论仍成立。",
      revision: { from: "程序员会继续存在", to: "程序员的职能会变，但承担责任的人仍需要存在" },
    },
  });
  await con.waitState((s) => s.revisions.length > 0);
  con.send({ type: "action", roomId, action: { kind: "submitClosing", text: "分歧在需求定义的归属。按我的标准，职业形态已经改变。" } });

  step(8, "⑤ 终局：等待 settled 与报告");
  const settled = await pro.waitState(
    (s) => s.phase === "settled" && Boolean(s.report),
    useRealHost ? 75_000 : 4_000,
  );
  const report = settled.report;
  log(`   phase=${settled.phase} · completed=${report.completed}`);
  log(`   质询记录 ${report.crossRecords.length} 条 · 修正 ${report.revisions.length} 条 · 分歧 ${report.openQuestions.length} 条`);
  log(`   段位结算: ${report.settlement.entries.map((e) => `${e.label} ${e.amount > 0 ? "+" : ""}${e.amount}`).join(" / ")} = ${report.settlement.total} MP`);
  log(`   当前段位: ${report.settlement.tier}（${report.settlement.mp} MP）`);
  log(`   Host 降级标记: ${report.hostDegraded}`);
  if (report.hostDegraded) log(`   Host 降级原因: ${settled.host?.reason || "未提供"}`);
  log(`   议题: ${report.topic.title.slice(0, 40)}…（真实作者 ${report.topic.pro.author} / ${report.topic.con.author}）`);
  if (!report.profiles.pro || !report.profiles.con) {
    throw new Error("终局评分没有写入双方六维画像");
  }

  step(9, "报告落盘回读");
  // 服务端在广播 settled 快照**之前**已完成落盘，所以这里文件应已就绪
  const files = await fs.readdir(storeDir);
  log(`   rooms 目录: ${files.join(", ")}`);
  if (!files.includes(`${roomId}.json`)) {
    throw new Error(`报告未落盘：${files.join(", ") || "(空)"}`);
  }
  const raw = JSON.parse(await fs.readFile(path.join(storeDir, `${roomId}.json`), "utf8"));
  log(`   落盘报告 completed=${raw.report.completed} · 序列化 ${JSON.stringify(raw).length} 字符`);

  step(10, "红线硬校验：报告里不得出现胜负语义");
  const flat = JSON.stringify(raw.report).toLowerCase();
  const forbidden = ["winner", "rank", "\"胜负\"", "赢了", "败"];
  const hits = forbidden.filter((f) => flat.includes(f.toLowerCase()));
  log(hits.length ? `   ✗ 命中: ${hits.join(", ")}` : "   ✓ 0 命中");

  step(11, "禁用词硬校验：模型/用户文本也不得带判输赢词族");
  pro.send({ type: "action", roomId, action: { kind: "freeSpeak", freeType: "反驳", text: "你错了，这局赢了" } });
  const err = await pro.waitFor((m) => m.type === "error" && m.code === "CONTENT_REJECTED");
  log(`   ✓ 被拒: ${err.message}`);

  pro.close();
  con.close();
  await ctx.close();

  const ok = hits.length === 0 && report.completed && (!useRealHost || !report.hostDegraded);
  log(`\n${ok ? "✓ 全部通过" : "✗ 存在问题"}`);
  process.exit(ok ? 0 : 1);
}

main().catch(async (error) => {
  console.error("\n✗ 失败:", error.message);
  process.exit(1);
});
