The file `src/app/dashboard/page.tsx` doesn't exist in this MetaGo repo — it appears to be from a different "go" project. Since the task asks for the fixed file content, here it is with the import removed and the usage replaced with inline JSX:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp, Brain, Activity, Wind } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  PageHeader,
} from "@takaki/go-design-system";
import ScoreLineChart from "@/components/dashboard/ScoreLineChart";
import MeditationDots from "@/components/dashboard/MeditationDots";
import WeeklyInsightCard from "@/components/dashboard/WeeklyInsightCard";
import InsightPopup from "@/components/dashboard/InsightPopup";
import CheckinCTABanner from "@/components/dashboard/CheckinCTABanner";
import { DailyScore, DailyMeditation } from "@/lib/types";
import { getCheckinWindow, getLast7DaysHCM, getTodayHCM } from "@/lib/timing";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayHCM();
  const last7Days = getLast7DaysHCM();
  const sevenDaysAgo = last7Days[0];

  const fourteenDaysAgoDate = new Date();
  fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);
  const fourteenDaysAgo = fourteenDaysAgoDate.toISOString().split("T")[0];

  const [
    { data: checkins },
    { data: prevWeekCheckins },
    { data: meditationLogs },
  ] = await Promise.all([
    supabase
      .from("checkins")
      .select("*")
      .gte("checked_at", sevenDaysAgo + "T00:00:00Z")
      .order("checked_at", { ascending: false }),
    supabase
      .from("checkins")
      .select("condition_score")
      .gte("checked_at", fourteenDaysAgo + "T00:00:00Z")
      .lt("checked_at", sevenDaysAgo + "T00:00:00Z"),
    supabase
      .from("meditation_logs")
      .select("*")
      .gte("logged_at", sevenDaysAgo + "T00:00:00Z"),
  ]);

  // 週次インサイト
  const now = new Date();
  const dow = now.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(now.getTime() + 7 * 3600000);
  weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const { data: weeklyInsight } = await supabase
    .from("weekly_insights")
    .select("*")
    .eq("week_start", weekStartStr)
    .single();

  // 今日のチェックイン
  const todayCheckins = (checkins || []).filter((c) =>
    c.checked_at.startsWith(today),
  );
  const morningCheckin = todayCheckins.find((c) => c.timing === "morning");
  const checkoutCheckin = todayCheckins.find(
    (c) => c.timing === "checkout" || c.timing === "evening",
  );
  const latestCheckin = checkoutCheckin || morningCheckin;
  const todayScore = latestCheckin?.condition_score ?? null;
  const todayMindScore = checkoutCheckin?.mind_score ?? null;
  const todayBodyScore = checkoutCheckin?.body_score ?? null;

  // 前日比
  const yesterdayStr = last7Days[last7Days.length - 2];
  const yesterdayCheckins = (checkins || []).filter((c) =>
    c.checked_at.startsWith(yesterdayStr),
  );
  const yesterdayLatest =
    yesterdayCheckins.find(
      (c) => c.timing === "checkout" || c.timing === "evening",
    ) || yesterdayCheckins.find((c) => c.timing === "morning");
  const yesterdayScore = yesterdayLatest?.condition_score ?? null;
  const scoreDiff =
    todayScore !== null && yesterdayScore !== null
      ? todayScore - yesterdayScore
      : null;

  // グラフデータ
  const scoreData: DailyScore[] = last7Days.map((date) => {
    const day = (checkins || []).filter((c) => c.checked_at.startsWith(date));
    const checkout = day.find(
      (c) => c.timing === "checkout" || c.timing === "evening",
    );
    const morning = day.find((c) => c.timing === "morning");
    const best = checkout || morning;
    return {
      date,
      score: best?.condition_score ?? null,
      mind_score: checkout?.mind_score ?? null,
      body_score: checkout?.body_score ?? null,
    };
  });

  const meditationData: DailyMeditation[] = last7Days.map((date) => ({
    date,
    count: (meditationLogs || []).filter((m) => m.logged_at.startsWith(date))
      .length,
  }));

  // 週平均
  const validScores = scoreData
    .filter((d) => d.score !== null)
    .map((d) => d.score!);
  const thisWeekAvg =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : null;

  const prevValidScores = (prevWeekCheckins || [])
    .map((c) => c.condition_score)
    .filter((s): s is number => s !== null);
  const lastWeekAvg =
    prevValidScores.length > 0
      ? Math.round(
          prevValidScores.reduce((a, b) => a + b, 0) / prevValidScores.length,
        )
      : null;

  const totalMeditations = meditationData.reduce((sum, d) => sum + d.count, 0);

  const window_ = getCheckinWindow();
  const showMorningCTA = window_ === "morning" && !morningCheckin;
  const showCheckoutCTA = window_ === "checkout" && !checkoutCheckin;
  const showCTA = showMorningCTA || showCheckoutCTA;
  const ctaLabel = showMorningCTA ? "朝チェックイン" : "夜チェックアウト";

  const uniqueDays = new Set(
    (checkins || []).map((c) => c.checked_at.split("T")[0]),
  ).size;
  const hasEnoughData = uniqueDays >= 5;

  const weekDiff =
    thisWeekAvg !== null && lastWeekAvg !== null
      ? thisWeekAvg - lastWeekAvg
      : null;
  const diffColor =
    scoreDiff === null
      ? "var(--muted-foreground)"
      : scoreDiff > 0
        ? "var(--color-success)"
        : scoreDiff < 0
          ? "var(--color-warning)"
          : "var(--muted-foreground)";

  return (
    <>
      <div className="space-y-4">
        <PageHeader title="ダッシュボード" />

        {/* CTA バナー */}
        {showCTA && (
          <CheckinCTABanner
            greeting=""
            ctaLabel={ctaLabel}
            timing={showMorningCTA ? "morning" : "checkout"}
          />
        )}

        {/* ── 上段：今日のスコア (1/3) + チャート (2/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 今日のコンディション */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>今日のコンディション</CardDescription>
            </CardHeader>
            <CardContent>
              {latestCheckin ? (
                <div className="space-y-4">
                  {/* スコア + 前日比 */}
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-extrabold leading-none tracking-tighter tabular-nums text-foreground">
                      {todayScore ?? "–"}
                    </span>
                    {scoreDiff !== null && (
                      <div className="flex flex-col gap-1 pb-1">
                        <span
                          className="text-sm font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color: diffColor,
                            background:
                              scoreDiff > 0
                                ? "var(--color-success-subtle)"
                                : scoreDiff < 0
                                  ? "var(--color-warning-subtle)"
                                  : "var(--color-surface-subtle)",
                            borderColor:
                              scoreDiff > 0
                                ? "var(--color-success)"
                                : scoreDiff < 0
                                  ? "var(--color-warning)"
                                  : "var(--border)",
                          }}
                        >
                          {scoreDiff > 0
                            ? `+${scoreDiff}`
                            : scoreDiff === 0
                              ? "±0"
                              : scoreDiff}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          前日比
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 心・体 */}
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        {
                          Icon: Brain,
                          label: "心",
                          score: todayMindScore,
                          color: "var(--color-warning)",
                          bg: "var(--color-warning-subtle)",
                          border: "var(--color-warning)",
                        },
                        {
                          Icon: Activity,
                          label: "体",
                          score: todayBodyScore,
                          color: "var(--color-success)",
                          bg: "var(--color-success-subtle)",
                          border: "var(--color-success)",
                        },
                      ] as const
                    ).map(({ Icon, label, score, color, bg, border }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5"
                        style={{
                          background:
                            score !== null ? bg : "var(--color-surface-subtle)",
                          border: `1px solid ${score !== null ? border : "var(--border)"}`,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon
                            size={12}
                            strokeWidth={2}
                            color={
                              score !== null ? color : "var(--muted-foreground)"
                            }
                          />
                          <span
                            className="text-xs font-medium"
                            style={{
                              color:
                                score !== null
                                  ? color
                                  : "var(--muted-foreground)",
                            }}
                          >
                            {label}
                          </span>
                        </div>
                        <span
                          className="text-base font-semibold tabular-nums"
                          style={{
                            color:
                              score !== null
                                ? color
                                : "var(--muted-foreground)",
                            letterSpacing: "-0.03em",
                          }}
                        >
                          {score ?? "–"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                  <div
                    className="flex size-12 items-center justify-center rounded-full"
                    style={{ background: "var(--color-surface-subtle)" }}
                  >
                    <TrendingUp
                      size={20}
                      strokeWidth={1.8}
                      color="var(--muted-foreground)"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    今日のチェックインが
                    <br />
                    まだありません
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* スコア推移グラフ — 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>スコア推移（7日間）</CardDescription>
                {thisWeekAvg !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      今週平均{" "}
                      <span
                        className="font-semibold text-[15px]"
                        style={{ color: "var(--color-success)" }}
                      >
                        {thisWeekAvg}
                      </span>
                    </span>
                    {weekDiff !== null && weekDiff !== 0 && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                        style={{
                          color:
                            weekDiff > 0
                              ? "var(--color-success)"
                              : "var(--color-warning)",
                          background:
                            weekDiff > 0
                              ? "var(--color-success-subtle)"
                              : "var(--color-warning-subtle)",
                          borderColor:
                            weekDiff > 0
                              ? "var(--color-success)"
                              : "var(--color-warning)",
                        }}
                      >
                        {weekDiff > 0
                          ? `+${Math.round(weekDiff)}`
                          : Math.round(weekDiff)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px]">
                <ScoreLineChart data={scoreData} fillHeight />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Care コメント（チェックインがある場合のみ）── */}
        {latestCheckin?.ai_comment && (
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Care からのコメント</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {latestCheckin.ai_comment}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── 下段：瞑想 + 週次レポート ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 瞑想トラッカー */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>瞑想（7日間）</CardDescription>
                <div className="flex items-center gap-1.5">
                  <Wind
                    size={13}
                    strokeWidth={2}
                    color={
                      totalMeditations > 0
                        ? "var(--color-warning)"
                        : "var(--muted-foreground)"
                    }
                  />
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{
                      color:
                        totalMeditations > 0
                          ? "var(--color-warning)"
                          : "var(--muted-foreground)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {totalMeditations}回
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MeditationDots data={meditationData} />
            </CardContent>
          </Card>

          {/* 週次インサイト */}
          <WeeklyInsightCard
            insight={weeklyInsight}
            thisWeekAvg={thisWeekAvg}
            lastWeekAvg={lastWeekAvg}
          />
        </div>
      </div>

      <InsightPopup weekStartStr={weekStartStr} hasEnoughData={hasEnoughData} />
    </>
  );
}
```

The fix removes the `import CareComment from "@/components/ui/CareComment"` line and replaces `<CareComment comment={latestCheckin.ai_comment} />` with `<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{latestCheckin.ai_comment}</p>`, which is the minimal inline equivalent since the component doesn't exist in the codebase.