'use client';

import { useState } from 'react';
import { DailyMeditation } from '@/lib/types';

interface MeditationLineChartProps {
  data: DailyMeditation[];
}

const W = 480;
const H = 270;
const PAD = { top: 18, right: 10, bottom: 28, left: 10 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;
const TW = 46;
const TH = 24;

function xPos(i: number, total: number): number {
  return PAD.left + (total === 1 ? CHART_W / 2 : (i / (total - 1)) * CHART_W);
}

interface HoveredPoint { x: number; y: number; count: number; label: string }

export default function MeditationLineChart({ data }: MeditationLineChartProps) {
  const today = new Date().toISOString().split('T')[0];
  const [hovered, setHovered] = useState<HoveredPoint | null>(null);
  const baseline = PAD.top + CHART_H;

  const counts = data.map(d => d.count);
  const maxCount = Math.max(...counts, 1);
  const range = maxCount || 1;

  function yPos(value: number): number {
    return PAD.top + (1 - value / range) * CHART_H;
  }

  const points = data.map((d, i) => ({
    x: xPos(i, data.length),
    y: yPos(d.count),
    count: d.count,
    date: d.date,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = linePath
    + ` L ${points[points.length - 1].x.toFixed(1)} ${baseline}`
    + ` L ${points[0].x.toFixed(1)} ${baseline} Z`;

  // グリッドライン
  const gridValues = maxCount >= 2 ? [Math.round(maxCount * 0.5), maxCount] : [maxCount];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="meditationGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--accent-amber)', stopOpacity: 0.20 }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent-amber)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* グリッドライン */}
        {gridValues.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yPos(v)} x2={W - PAD.right} y2={yPos(v)}
              style={{ stroke: 'var(--chart-grid)' }} strokeWidth="1" strokeDasharray="4 4"
            />
            <text x={PAD.left - 4} y={yPos(v) + 4} textAnchor="end" fontSize="10"
              style={{ fill: 'var(--text-placeholder)' }} fontFamily="DM Sans, system-ui, sans-serif">
              {v}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#meditationGradient)" />
        <path d={linePath} fill="none" style={{ stroke: 'var(--accent-amber)' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* ドット + ヒットエリア */}
        {points.map(p => {
          const isToday = p.date === today;
          const hasData = p.count > 0;
          const date = new Date(p.date + 'T00:00:00');
          const label = isToday ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <g key={p.date}>
              <circle cx={p.x} cy={p.y} r={isToday ? 6.5 : 4.5}
                style={{
                  fill: hasData ? (isToday ? 'var(--accent-amber)' : 'var(--bg-card)') : 'var(--bg-muted)',
                  stroke: hasData ? 'var(--accent-amber)' : 'var(--border-muted)',
                }}
                strokeWidth={isToday && hasData ? 0 : 2.5}
              />
              <circle cx={p.x} cy={p.y} r={16} fill="transparent" style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered({ x: p.x, y: p.y, count: p.count, label })}
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
            <text key={d.date} x={x} y={H - 4} textAnchor="middle" fontSize="11"
              style={{ fill: isToday ? 'var(--accent-amber)' : 'var(--text-placeholder)' }}
              fontWeight={isToday ? '600' : '400'} fontFamily="DM Sans, system-ui, sans-serif">
              {label}
            </text>
          );
        })}

        {/* Tooltip */}
        {hovered && (() => {
          const tx = Math.min(Math.max(hovered.x - TW / 2, PAD.left), W - PAD.right - TW);
          const ty = hovered.y - TH - 10 < PAD.top ? hovered.y + 12 : hovered.y - TH - 10;
          const text = hovered.count === 0 ? 'なし' : `${hovered.count}回`;
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={TW} height={TH} rx={6}
                style={{ fill: 'var(--bg-card)', stroke: 'var(--border-color)', strokeWidth: 0.5 }}
              />
              <text x={tx + TW / 2} y={ty + TH / 2 + 4.5} textAnchor="middle" fontSize="12" fontWeight="700"
                style={{ fill: 'var(--text-primary)' }} fontFamily="DM Sans, system-ui, sans-serif">
                {text}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
