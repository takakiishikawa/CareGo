"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { DailyScore } from "@/lib/types";

interface ScoreLineChartProps {
  data: DailyScore[];
  fillHeight?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "8px 14px",
        boxShadow: "var(--shadow-lg)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-subtle)",
          marginBottom: "2px",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--foreground)",
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
        }}
      >
        {payload[0].value}
      </div>
    </div>
  );
}

export default function ScoreLineChart({
  data,
  fillHeight = false,
}: ScoreLineChartProps) {
  const today = new Date().toISOString().split("T")[0];

  const chartData = data.map((d) => {
    const isToday = d.date === today;
    const date = new Date(d.date + "T00:00:00");
    const label = isToday ? "今日" : `${date.getMonth() + 1}/${date.getDate()}`;
    return { label, score: d.score, date: d.date, isToday };
  });

  const scores = data
    .map((d) => d.score)
    .filter((s): s is number => s !== null);
  const minScore = scores.length > 0 ? Math.max(0, Math.min(...scores) - 8) : 0;
  const maxScore =
    scores.length > 0 ? Math.min(100, Math.max(...scores) + 8) : 100;

  const todayDot = chartData.find((d) => d.isToday && d.score != null);

  return (
    <div
      style={{
        width: "100%",
        height: fillHeight ? "100%" : 240,
        minHeight: 180,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 4, left: 0 }}
        >
          <defs>
            <linearGradient id="scoreGradFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-primary)"
                stopOpacity={0.18}
              />
              <stop
                offset="80%"
                stopColor="var(--color-primary)"
                stopOpacity={0.02}
              />
              <stop
                offset="100%"
                stopColor="var(--color-primary)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="var(--color-border-subtle)"
            vertical={false}
            strokeWidth={1}
          />

          <XAxis
            dataKey="label"
            tick={{
              fontSize: 12,
              fill: "var(--color-text-subtle)",
              fontFamily: "DM Sans, system-ui, sans-serif",
            }}
            tickLine={false}
            axisLine={false}
            dy={6}
          />

          <YAxis
            domain={[minScore, maxScore]}
            tick={{
              fontSize: 12,
              fill: "var(--color-text-subtle)",
              fontFamily: "DM Sans, system-ui, sans-serif",
            }}
            tickLine={false}
            axisLine={false}
            width={28}
            tickCount={4}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "var(--border)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#scoreGradFill)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--color-primary)",
              stroke: "var(--card)",
              strokeWidth: 2,
            }}
            connectNulls={false}
          />

          {todayDot && todayDot.score != null && (
            <ReferenceDot
              x={todayDot.label}
              y={todayDot.score}
              r={6}
              fill="var(--color-primary)"
              stroke="var(--card)"
              strokeWidth={2.5}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
