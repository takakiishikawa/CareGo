'use client';

import { useState } from 'react';
import { DailyScore } from '@/lib/types';

interface ScoreLineChartProps {
  data: DailyScore[];
  fillHeight?: boolean;
}

const W = 480;
const H = 510;
const PAD = { top: 18, right: 10, bottom: 36, left: 18 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;
const TW = 56;
const TH = 28;

function xPos(i: number, total: number): number {
  return PAD.left + (total === 1 ? CHART_W / 2 : (i / (total - 1)) * CHART_W);
}

interface HoveredPoint { x: number; y: number; value: number; label: string }

export default function ScoreLineChart({ data, fillHeight = false }: ScoreLineChartProps) {
  const today = new Date().toISOString().split('T')[0];
  const [hovered, setHovered] = useState<HoveredPoint | null>(null);

  const scores = data.map(d => d.score).filter((s): s is number => s !== null);
  const minScore = scores.length > 0 ? Math.max(0, Math.min(...scores) - 10) : 0;
  const maxScore = scores.length > 0 ? Math.min(100, Math.max(...scores) + 10) : 100;
  const range = maxScore - minScore || 1;

  function yPos(value: number): number {
    return PAD.top + (1 - (value - minScore) / range) * CHART_H;
  }

  type Pt = { x: number; y: number };
  const groups: Pt[][] = [];
  let cur: Pt[] = [];
  data.forEach((d, i) => {
    if (d.score !== null) {
      cur.push({ x: xPos(i, data.length), y: yPos(d.score) });
    } else if (cur.length > 0) { groups.push(cur); cur = []; }
  });
  if (cur.length > 0) groups.push(cur);

  const baseline = PAD.top + CHART_H;

  // グリッドライン（データ範囲に合わせて3本）
  const gridValues = [
    Math.round(minScore + range * 0.25),
    Math.round(minScore + range * 0.5),
    Math.round(minScore + range * 0.75),
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: fillHeight ? '100%' : 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--accent-green)', stopOpacity: 0.20 }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent-green)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* グリッドライン */}
        {gridValues.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yPos(v)} x2={W - PAD.right} y2={yPos(v)}
              style={{ stroke: 'var(--chart-grid)' }} strokeWidth="1" strokeDasharray="4 4"
            />
            <text x={PAD.left - 4} y={yPos(v) + 4} textAnchor="end" fontSize="14"
              style={{ fill: 'var(--text-placeholder)' }} fontFamily="DM Sans, system-ui, sans-serif">
              {v}
            </text>
          </g>
        ))}

        {/* エリア + ライン */}
        {groups.map((group, gi) => {
          if (group.length === 0) return null;
          const linePath = group.map((p, pi) => `${pi === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
          const areaPath = group.map((p, pi) => `${pi === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
            + ` L ${group[group.length - 1].x.toFixed(1)} ${baseline} L ${group[0].x.toFixed(1)} ${baseline} Z`;
          return (
            <g key={gi}>
              <path d={areaPath} fill="url(#scoreGradient)" />
              <path d={linePath} fill="none" style={{ stroke: 'var(--accent-green)' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

        {/* ドット + ヒットエリア */}
        {data.map((d, i) => {
          if (d.score === null) return null;
          const cx = xPos(i, data.length);
          const cy = yPos(d.score);
          const isToday = d.date === today;
          const date = new Date(d.date + 'T00:00:00');
          const label = isToday ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <g key={d.date}>
              <circle cx={cx} cy={cy} r={isToday ? 6.5 : 4.5}
                style={{ fill: isToday ? 'var(--accent-green)' : 'var(--bg-card)', stroke: 'var(--accent-green)' }}
                strokeWidth={isToday ? 0 : 2.5}
              />
              <circle cx={cx} cy={cy} r={16} fill="transparent" style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered({ x: cx, y: cy, value: d.score!, label })}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}

        {/* X軸ラベル */}
        {data.map((d, i) => {
          const x = xPos(i, data.length);
          const isToday = d.date === today;
          const date = new Date(d.date + 'T00:00:00');
          const label = isToday ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <text key={d.date} x={x} y={H - 4} textAnchor="middle" fontSize="14"
              style={{ fill: isToday ? 'var(--accent-green)' : 'var(--text-placeholder)' }}
              fontWeight={isToday ? '600' : '400'} fontFamily="DM Sans, system-ui, sans-serif">
              {label}
            </text>
          );
        })}

        {/* Tooltip */}
        {hovered && (() => {
          const tx = Math.min(Math.max(hovered.x - TW / 2, PAD.left), W - PAD.right - TW);
          const ty = hovered.y - TH - 10 < PAD.top ? hovered.y + 12 : hovered.y - TH - 10;
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={TW} height={TH} rx={6}
                style={{ fill: 'var(--bg-card)', stroke: 'var(--border-color)', strokeWidth: 0.5 }}
              />
              <text x={tx + TW / 2} y={ty + TH / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="700"
                style={{ fill: 'var(--text-primary)' }} fontFamily="DM Sans, system-ui, sans-serif">
                {hovered.value}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
