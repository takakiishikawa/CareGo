import { BrainCircuit } from "lucide-react";
import { Card } from "@takaki/go-design-system";
import { WeeklyInsight } from "@/lib/types";
import { parseInsightSections, SECTION_META } from "@/lib/insight-utils";

interface WeeklyInsightCardProps {
  insight: WeeklyInsight | null;
  thisWeekAvg: number | null;
  lastWeekAvg: number | null;
}

export default function WeeklyInsightCard({
  insight,
  thisWeekAvg,
  lastWeekAvg,
}: WeeklyInsightCardProps) {
  const weekDiff =
    thisWeekAvg !== null && lastWeekAvg !== null
      ? Math.round(thisWeekAvg - lastWeekAvg)
      : null;

  return (
    <Card className="p-6">
      {/* ヘッダー */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BrainCircuit
              size={16}
              strokeWidth={1.8}
              color="var(--color-primary)"
            />
          </div>
          <div>
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--foreground)",
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              週次レポート
            </p>
            {weekDiff !== null && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color:
                    weekDiff > 0
                      ? "var(--color-success)"
                      : weekDiff < 0
                        ? "var(--color-warning)"
                        : "var(--color-text-subtle)",
                  margin: 0,
                }}
              >
                {weekDiff > 0
                  ? `先週より+${weekDiff}pt 上向き`
                  : weekDiff < 0
                    ? `先週より${weekDiff}pt`
                    : "先週と同水準"}
              </p>
            )}
          </div>
        </div>

        {/* 週平均バッジ */}
        {thisWeekAvg !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                textAlign: "right",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-success-subtle)",
                border: "1px solid var(--color-success)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-success)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                今週平均
              </div>
              <div
                style={{
                  fontSize: "var(--text-xl)",
                  fontWeight: 800,
                  color: "var(--color-success)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                }}
              >
                {Math.round(thisWeekAvg)}
              </div>
            </div>
            {lastWeekAvg !== null && (
              <div
                style={{
                  textAlign: "right",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-subtle)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-subtle)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  先週
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: 700,
                    color: "var(--color-text-secondary)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                  }}
                >
                  {Math.round(lastWeekAvg)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 本文 */}
      {insight ? (
        (() => {
          const sections = parseInsightSections(insight.insight_text);
          return sections ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {SECTION_META.map(({ key, label, Icon, color, bg, border }) => {
                const text = sections[key];
                if (!text) return null;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "14px 16px",
                      borderRadius: "var(--radius-lg)",
                      background: bg,
                      border: `1px solid ${border}`,
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--card)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--shadow-sm)",
                        marginTop: "1px",
                      }}
                    >
                      <Icon size={14} strokeWidth={2} color={color} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 700,
                          color,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--foreground)",
                          lineHeight: 1.75,
                          margin: 0,
                        }}
                      >
                        {text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--foreground)",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {insight.insight_text}
            </p>
          );
        })()
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <BrainCircuit
            size={18}
            strokeWidth={1.8}
            color="var(--color-text-subtle)"
          />
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-subtle)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            日曜日にログインすると、今週の振り返りが生成されます。
          </p>
        </div>
      )}
    </Card>
  );
}
