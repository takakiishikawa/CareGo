import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrainCircuit, ChevronDown } from "lucide-react";
import { WeeklyInsight } from "@/lib/types";
import { Card, PageHeader } from "@takaki/go-design-system";
import { parseInsightSections, SECTION_META } from "@/lib/insight-utils";

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} 〜 ${fmt(end)}`;
}

function InsightCard({ insight }: { insight: WeeklyInsight }) {
  const sections = parseInsightSections(insight.insight_text);
  const weekRange = formatWeekRange(insight.week_start);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BrainCircuit
              size={17}
              strokeWidth={1.8}
              color="var(--color-primary)"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              週次レポート
            </p>
            <p className="text-xs text-muted-foreground">{weekRange}</p>
          </div>
        </div>

        {insight.avg_score !== null && (
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-success-subtle)",
              border: "1px solid var(--color-success)",
              textAlign: "right",
            }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-success)" }}
            >
              週平均
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--color-success)",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              {Math.round(insight.avg_score)}
            </div>
          </div>
        )}
      </div>

      {sections ? (
        <div className="grid gap-2.5">
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
                      fontSize: "11px",
                      fontWeight: 700,
                      color,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-base text-foreground leading-loose">
          {insight.insight_text}
        </p>
      )}
    </Card>
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: insights } = await supabase
    .from("weekly_insights")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(12);

  return (
    <div className="space-y-4">
      <PageHeader
        title="週次レポート"
        description="毎週のコンディション振り返り記録"
      />

      {insights && insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div key={insight.id}>
              {idx === 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  最新
                </p>
              )}
              {idx === 1 && (
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    過去のレポート
                  </p>
                  <ChevronDown
                    size={13}
                    strokeWidth={2}
                    className="text-muted-foreground"
                  />
                </div>
              )}
              <InsightCard insight={insight as WeeklyInsight} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12 flex flex-col items-center text-center">
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-surface-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <BrainCircuit
              size={22}
              strokeWidth={1.8}
              color="var(--color-text-subtle)"
            />
          </div>
          <p className="text-base font-semibold text-muted-foreground mb-2">
            まだレポートがありません
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            5日以上チェックインすると
            <br />
            週次レポートが生成されます
          </p>
        </Card>
      )}
    </div>
  );
}
