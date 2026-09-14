import { describe, expect, it } from "vitest";

import { eventReplays, findEventReplay } from "../src/data/eventReplays";
import { validateEventReplay } from "../src/domain/eventReplay";

/**
 * 事件库准入守卫。
 *
 * 这一层是「准入是代码校验，不是靠人自觉」的落点：
 * 任何人往 `eventReplays` 里加事件，只要踩到准入底线，这里就红。
 */
describe("事件库准入", () => {
  it("每个入库事件都通过准入校验（含来源、角色位差异、幕连续性）", () => {
    expect(eventReplays.length).toBeGreaterThan(0);
    const failures = eventReplays
      .map((event) => ({ id: event.header.id, result: validateEventReplay(event) }))
      .filter((item) => !item.result.ok);
    expect(failures).toEqual([]);
  });

  it("事件 id 唯一，且都能按 id 取回", () => {
    const ids = eventReplays.map((event) => event.header.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(findEventReplay(id)?.header.id).toBe(id));
    expect(findEventReplay("no-such-event")).toBeNull();
    expect(findEventReplay(null)).toBeNull();
  });

  it("不含占位来源：所有 canon 来源都是真实知乎 https 链接并记录了审核时间", () => {
    const urls = eventReplays.flatMap((event) =>
      event.canon.flatMap((entry) => entry.sources.map((source) => source.url)),
    );
    expect(urls.length).toBeGreaterThan(0);
    urls.forEach((url) => {
      expect(url).not.toBe("#");
      expect(url).toMatch(/^https:\/\/(www\.)?zhihu\.com\/(question|answer|p)\//);
    });
    eventReplays
      .flatMap((event) => event.canon)
      .forEach((entry) => entry.sources.forEach((source) => expect(source.reviewedAt.trim()).not.toBe("")));
  });

  it("每个事件都有 ≥3 幕、≥2 个角色位、每幕都有原作轨迹", () => {
    eventReplays.forEach((event) => {
      expect(event.acts.length).toBeGreaterThanOrEqual(3);
      expect(event.positions.length).toBeGreaterThanOrEqual(2);
      const covered = new Set(event.canon.map((entry) => entry.actIndex));
      event.acts.forEach((act) => expect(covered.has(act.index)).toBe(true));
    });
  });

  it("角色位不指向可识别的真实个人：名称一律为化名或位置", () => {
    eventReplays
      .flatMap((event) => event.positions)
      .forEach((position) => expect(position.name).toMatch(/化名|负责人|当事人|伴侣|家人|出资方/));
  });
});
