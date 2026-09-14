/**
 * 六维结构画像雷达图（SVG 手绘，不引图表库）
 *
 * 红线：**不排名、不比较、不定胜负**。
 *   - 本组件只画一个人的六维值；两人对比时叠加两条线，但**不标谁高谁低**。
 *   - 不出现「得分 / 排名 / 胜」等字眼。
 *
 * 与原型一致：6 个顶点从 12 点钟顺时针，网格 4 圈（25/50/75/100）。
 */

import { PROFILE_DIMS } from "../../types/debateRoom";
import { radarPoints } from "../debateRoomUi";

export interface RadarSeries {
  values: number[] | null;
  /** 描边色：正方蓝、反方灰黑 */
  color: string;
  label: string;
}

interface RadarProps {
  series: RadarSeries[];
  size?: number;
  title?: string;
}

const GRID_LEVELS = [25, 50, 75, 100];

export function ProfileRadar({ series, size = 240, title }: RadarProps) {
  const radius = size / 2 - 34;
  const cx = size / 2;
  const cy = size / 2;

  // 网格多边形：每个层级一个正六边形
  const gridPaths = GRID_LEVELS.map((level) => {
    const points = radarPoints(
      PROFILE_DIMS.map(() => level),
      cx,
      cy,
      radius,
    );
    return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  });

  // 轴线：圆心 → 各顶点
  const axes = radarPoints(
    PROFILE_DIMS.map(() => 100),
    cx,
    cy,
    radius,
  );

  // 维度标签（比顶点再外推 20px）
  const labels = radarPoints(
    PROFILE_DIMS.map(() => 100),
    cx,
    cy,
    radius + 20,
  );

  return (
    <div className="dr-radar">
      {title ? <div className="dr-radar-title">{title}</div> : null}
      <svg width={size} height={size} role="img" aria-label={title ?? "六维结构画像"}>
        {gridPaths.map((points, index) => (
          <polygon
            key={GRID_LEVELS[index]}
            points={points}
            fill="none"
            stroke="#e6ebf2"
            strokeWidth={1}
          />
        ))}
        {axes.map((point, index) => (
          <line key={PROFILE_DIMS[index]} x1={cx} y1={cy} x2={point.x} y2={point.y} stroke="#eef2f7" strokeWidth={1} />
        ))}

        {series.map((item) => {
          if (!item.values) return null;
          const points = radarPoints(item.values, cx, cy, radius);
          const path = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          return (
            <g key={item.label}>
              <polygon points={path} fill={item.color} fillOpacity={0.16} stroke={item.color} strokeWidth={1.8} />
              {points.map((point, index) => (
                <circle key={PROFILE_DIMS[index]} cx={point.x} cy={point.y} r={2.6} fill={item.color} />
              ))}
            </g>
          );
        })}

        {labels.map((point, index) => (
          <text
            key={`label-${PROFILE_DIMS[index]}`}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill="#8590a6"
          >
            {PROFILE_DIMS[index]}
          </text>
        ))}
      </svg>

      <div className="dr-radar-values">
        {series.map((item) => (
          <div key={item.label} className="dr-radar-row">
            <span className="dr-radar-dot" style={{ background: item.color }} />
            <span className="dr-radar-name">{item.label}</span>
            <span className="dr-radar-num">
              {item.values
                ? PROFILE_DIMS.map((dim, index) => `${dim} ${Math.round(item.values![index] ?? 0)}`).join(" · ")
                : "本场无历史画像"}
            </span>
          </div>
        ))}
      </div>
      <p className="dr-radar-note">六维结构画像仅反映本场可观测行为，不排名、不构成胜负判定。</p>
    </div>
  );
}
