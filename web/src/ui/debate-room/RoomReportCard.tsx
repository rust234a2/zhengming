/**
 * 辩论间 · 对局报告弹层（⑤ 终局产物）
 *
 * 红线落点：
 *   - 「不判输赢」：报告里**物理上没有胜负槽位**；顶部副标题常驻说明「不构成胜负判定」。
 *   - 「不排名」：六维画像并排展示，**不给名次、不给谁高谁低**。
 *   - 段位只展示**参与度结算明细**（完成对局 / 离席扣分），没有胜负奖励。
 *
 * 可随时退出：点 ✕ 或遮罩空白关闭，回到辩论间回看本场记录（PRD §8）。
 */

import { useEffect } from "react";

import type { RoomReport, SeatId } from "../../types/debateRoom";
import { PROFILE_DIMS } from "../../types/debateRoom";
import { reportSections } from "../debateRoomUi";
import { ProfileRadar } from "./ProfileRadar";

const SEAT_NAME: Record<SeatId, string> = { pro: "正方", con: "反方" };

const SEAT_COLOR: Record<SeatId, string> = { pro: "#056de8", con: "#4c586e" };

export function RoomReportCard({
  report,
  seatNames,
  onClose,
  onRestart,
}: {
  report: RoomReport;
  /** 席位显示名（用真人昵称而非"正方"） */
  seatNames?: Partial<Record<SeatId, string>>;
  onClose: () => void;
  onRestart?: () => void;
}) {
  const sections = reportSections(report);

  // Esc 关闭（PRD：点 ✕ 或遮罩空白关闭）
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const label = (seat: SeatId) => seatNames?.[seat] || SEAT_NAME[seat];

  return (
    <div
      className="dr-mask"
      role="dialog"
      aria-modal="true"
      aria-label="对局报告"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dr-endcard">
        <button type="button" className="dr-end-close" onClick={onClose} title="关闭报告，回到辩论间" aria-label="关闭报告">
          ✕
        </button>

        <h2>对局报告</h2>
        <p className="dr-end-sub">
          {report.completed ? "五阶段走满 · 轮次结束即完成" : "未完成局（中途结束）"}
          {" · "}AI 中立评估不构成胜负判定
          {report.hostDegraded ? " · 本场 Host 走的是启发式降级（模拟）" : ""}
        </p>

        <div className="dr-end-grid">
          <div className="dr-end-left">
            <section className="dr-end-claims">
              <h3>双方立论结构</h3>
              <div className="dr-end-briefs">
                {(["pro", "con"] as SeatId[]).map((seat) => {
                  const brief = report.briefs[seat];
                  return (
                    <div key={seat} className="dr-end-brief">
                      <div className="dr-end-brief-head">
                        <i style={{ background: SEAT_COLOR[seat] }} />
                        {label(seat)}
                      </div>
                      {brief ? (
                        <>
                          {brief.definition ? (
                            <p>
                              <em>定义</em>
                              {brief.definition}
                            </p>
                          ) : null}
                          <p>
                            <em>结论</em>
                            {brief.conclusion}
                          </p>
                          {(brief.reasons ?? []).map((reason, index) => (
                            <p key={reason}>
                              <em>理由 {index + 1}</em>
                              {reason}
                            </p>
                          ))}
                          {brief.evidence ? (
                            <p>
                              <em>依据</em>
                              {brief.evidence}
                              {brief.evidenceStatus ? <span className="dr-end-status">{brief.evidenceStatus}</span> : null}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="dr-end-none">本场未提交立论结构。</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {sections.map((section) => (
              <section key={section.id} className="dr-end-sec">
                <h3>{section.title}</h3>
                {section.items.length ? (
                  <ul>
                    {section.items.map((item, index) => (
                      <li key={`${section.id}-${index}`}>
                        {item.meta ? <span className="dr-end-meta">{item.meta}</span> : null}
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dr-end-none">{section.emptyText}</p>
                )}
              </section>
            ))}
          </div>

          <div className="dr-end-right">
            <ProfileRadar
              title="六维结构画像（不排名）"
              size={252}
              series={[
                { label: label("pro"), values: report.profiles.pro, color: SEAT_COLOR.pro },
                { label: label("con"), values: report.profiles.con, color: SEAT_COLOR.con },
              ]}
            />

            {report.grounds.length ? (
              <section className="dr-end-sec">
                <h3>六维评估依据</h3>
                <ul>
                  {report.grounds.map((ground, index) => (
                    <li key={`ground-${index}`}>
                      <span className="dr-end-meta">{ground.seat ? `${label(ground.seat)} · ` : ""}{ground.dim}</span>
                      <span>「{ground.quote}」——{ground.reason}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {report.verdict ? (
              <section className="dr-end-sec">
                <h3>评估总结</h3>
                <p className="dr-end-verdict">{report.verdict}</p>
                <p className="dr-end-none">该总结描述的是结构表现，不构成胜负判定。</p>
              </section>
            ) : null}

            <section className="dr-end-sec dr-end-mp">
              <h3>段位结算（参与度）</h3>
              <div className="dr-mp-total">
                <b>{report.settlement.tier}</b>
                <span>
                  {report.settlement.mp} MP
                  {report.settlement.total !== 0 ? `（本场 ${report.settlement.total > 0 ? "+" : ""}${report.settlement.total}）` : ""}
                </span>
              </div>
              <ul className="dr-mp-entries">
                {report.settlement.entries.length ? (
                  report.settlement.entries.map((entry, index) => (
                    <li key={`mp-${index}`}>
                      <span>{entry.label}</span>
                      <b className={entry.amount > 0 ? "plus" : "minus"}>{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</b>
                    </li>
                  ))
                ) : (
                  <li className="dr-end-none">本场没有产生段位变动。</li>
                )}
              </ul>
              {report.settlement.toNext ? (
                <p className="dr-end-none">
                  距「{report.settlement.toNext.tier}」还差 {report.settlement.toNext.remaining} MP。
                </p>
              ) : (
                <p className="dr-end-none">已达最高段「和鸣」。</p>
              )}
              <p className="dr-end-none">段位只衡量参与行为，不含任何胜负奖励。</p>
            </section>

            <div className="dr-end-actions">
              <button type="button" className="dr-mini" onClick={onClose}>
                收起报告
              </button>
              {onRestart ? (
                <button type="button" className="dr-submit" onClick={onRestart}>
                  再来一局
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 供外部复用的维度名（避免各处再 import 一次） */
export { PROFILE_DIMS };
