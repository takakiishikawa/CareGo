"use client";

import {
  Moon,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  MoonStar,
  TrendingUp,
  Minus,
  TrendingDown,
} from "lucide-react";
import { Rating, TimePeriodRatings } from "@/lib/types";

interface Period {
  key: string;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    color?: string;
  }>;
}

const MORNING_PERIODS: Period[] = [
  { key: "last_night", label: "昨夜", Icon: Moon },
  { key: "this_morning", label: "今朝", Icon: Sunrise },
];

const EVENING_PERIODS: Period[] = [
  { key: "morning", label: "午前", Icon: Sun },
  { key: "afternoon", label: "午後", Icon: CloudSun },
  { key: "evening", label: "夕方", Icon: Sunset },
  { key: "night", label: "夜", Icon: MoonStar },
];

const PERIOD_LABELS: Record<string, [string, string, string]> = {
  last_night: ["ぐっすり", "まあまあ", "眠れず"],
  this_morning: ["すっきり", "普通", "だるい"],
  morning: ["集中できた", "普通", "低調"],
  afternoon: ["元気だった", "普通", "疲れた"],
  evening: ["すっきり", "普通", "疲労感"],
  night: ["落ち着いた", "普通", "ざわざわ"],
};

interface RatingOption {
  value: Rating;
  Icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    color?: string;
  }>;
  color: string;
  bg: string;
  border: string;
}

const RATING_OPTIONS: RatingOption[] = [
  {
    value: "A",
    Icon: TrendingUp,
    color: "var(--color-success)",
    bg: "var(--color-success-subtle)",
    border: "var(--color-success)",
  },
  {
    value: "B",
    Icon: Minus,
    color: "var(--muted-foreground)",
    bg: "var(--color-surface-subtle)",
    border: "var(--border)",
  },
  {
    value: "C",
    Icon: TrendingDown,
    color: "var(--color-warning)",
    bg: "var(--color-warning-subtle)",
    border: "var(--color-warning)",
  },
];

interface TimePeriodSelectorProps {
  timing: "morning" | "checkout";
  ratings: TimePeriodRatings;
  onChange: (ratings: TimePeriodRatings) => void;
}

export default function TimePeriodSelector({
  timing,
  ratings,
  onChange,
}: TimePeriodSelectorProps) {
  const periods = timing === "morning" ? MORNING_PERIODS : EVENING_PERIODS;

  const select = (periodKey: string, rating: Rating) => {
    onChange({ ...ratings, [periodKey]: rating });
  };

  return (
    <div
      className={`grid gap-3 ${timing === "checkout" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
    >
      {periods.map(({ key, label, Icon }) => {
        const selected = ratings[key] as Rating | undefined;
        const labels = PERIOD_LABELS[key] ?? ["良い", "普通", "悪い"];

        return (
          <div
            key={key}
            className="rounded-lg p-4 transition-all duration-150"
            style={{
              background: selected
                ? "var(--color-surface-subtle)"
                : "var(--card)",
              border: `1px solid ${selected ? "var(--color-border-strong, var(--border))" : "var(--border)"}`,
            }}
          >
            {/* Period header */}
            <div className="flex items-center gap-2 mb-3">
              <Icon
                size={14}
                strokeWidth={1.8}
                color={
                  selected
                    ? "var(--color-primary)"
                    : "var(--color-text-subtle, var(--muted-foreground))"
                }
              />
              <span
                className="text-sm font-semibold tracking-tight"
                style={{
                  color: selected
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                }}
              >
                {label}
              </span>
              {selected && (
                <span
                  className="ml-auto text-xs font-medium"
                  style={{
                    color: RATING_OPTIONS.find((r) => r.value === selected)
                      ?.color,
                  }}
                >
                  {selected === "A"
                    ? "良い"
                    : selected === "B"
                      ? "普通"
                      : "悪い"}
                </span>
              )}
            </div>

            {/* Rating buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {RATING_OPTIONS.map(
                ({ value, Icon: RIcon, color, bg, border }, idx) => {
                  const isSelected = selected === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => select(key, value)}
                      className="flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-md transition-all duration-150 cursor-pointer"
                      style={{
                        border: isSelected
                          ? `1.5px solid ${border}`
                          : "1px solid var(--border)",
                        background: isSelected ? bg : "var(--card)",
                        boxShadow: isSelected ? `0 0 0 1px ${border}` : "none",
                        transform: isSelected ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      <RIcon
                        size={13}
                        strokeWidth={2.2}
                        color={isSelected ? color : "var(--muted-foreground)"}
                      />
                      <span
                        className="text-[11px] leading-tight text-center"
                        style={{
                          color: isSelected ? color : "var(--muted-foreground)",
                          fontWeight: isSelected ? 600 : 400,
                          wordBreak: "break-all",
                        }}
                      >
                        {labels[idx]}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
