import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TrendingUp, Brain, Activity } from 'lucide-react';
import { Card, PageHeader } from '@takaki/go-design-system';
import CareComment from '@/components/ui/CareComment';
import ScoreLineChart from '@/components/dashboard/ScoreLineChart';
import MeditationDots from '@/components/dashboard/MeditationDots';
import WeeklyInsightCard from '@/components/dashboard/WeeklyInsightCard';
import InsightPopup from '@/components/dashboard/InsightPopup';
import { DailyScore, DailyMeditation } from '@/lib/types';
import { getCheckinWindow, getLast7DaysHCM, getTodayHCM } from '@/lib/timing';
import CheckinCTABanner from '@/components/dashboard/CheckinCTABanner';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = getTodayHCM();
  const last7Days = getLast7DaysHCM();
  const sevenDaysAgo = last7Days[0];

  const fourteenDaysAgoDate = new Date();
  fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);
  const fourteenDaysAgo = fourteenDaysAgoDate.toISOString().split('T')[0];

  const [
    { data: checkins },
    { data: prevWeekCheckins },
    { data: meditationLogs },
  ] = await Promise.all([
    supabase.from('checkins').select('*').gte('checked_at', sevenDaysAgo + 'T00:00:00Z').order('checked_at', { ascending: false }),
    supabase.from('checkins').select('condition_score').gte('checked_at', fourteenDaysAgo + 'T00:00:00Z').lt('checked_at', sevenDaysAgo + 'T00:00:00Z'),
    supabase.from('meditation_logs').select('*').gte('logged_at', sevenDaysAgo + 'T00:00:00Z'),
  ]);

  const now = new Date();
  const dow = now.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(now.getTime() + 7 * 3600000);
  weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const { data: weeklyInsight } = await supabase
    .from('weekly_insights').select('*').eq('week_start', weekStartStr).single();

  const todayCheckins = (checkins || []).filter(c => c.checked_at.startsWith(today));
  const morningCheckin = todayCheckins.find(c => c.timing === 'morning');
  const checkoutCheckin = todayCheckins.find(c => c.timing === 'checkout' || c.timing === 'evening');
  const latestCheckin = checkoutCheckin || morningCheckin;
  const todayScore = latestCheckin?.condition_score ?? null;
  const todayMindScore = checkoutCheckin?.mind_score ?? null;
  const todayBodyScore = checkoutCheckin?.body_score ?? null;

  const yesterdayStr = last7Days[last7Days.length - 2];
  const yesterdayCheckins = (checkins || []).filter(c => c.checked_at.startsWith(yesterdayStr));
  const yesterdayLatest =
    yesterdayCheckins.find(c => c.timing === 'checkout' || c.timing === 'evening') ||
    yesterdayCheckins.find(c => c.timing === 'morning');
  const yesterdayScore = yesterdayLatest?.condition_score ?? null;
  const scoreDiff = todayScore !== null && yesterdayScore !== null ? todayScore - yesterdayScore : null;

  const scoreData: DailyScore[] = last7Days.map(date => {
    const day = (checkins || []).filter(c => c.checked_at.startsWith(date));
    const checkout = day.find(c => c.timing === 'checkout' || c.timing === 'evening');
    const morning = day.find(c => c.timing === 'morning');
    const best = checkout || morning;
    return {
      date,
      score: best?.condition_score ?? null,
      mind_score: checkout?.mind_score ?? null,
      body_score: checkout?.body_score ?? null,
    };
  });

  const meditationData: DailyMeditation[] = last7Days.map(date => ({
    date,
    count: (meditationLogs || []).filter(m => m.logged_at.startsWith(date)).length,
  }));

  const validScores = scoreData.filter(d => d.score !== null).map(d => d.score!);
  const thisWeekAvg = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  const prevValidScores = (prevWeekCheckins || [])
    .map(c => c.condition_score)
    .filter((s): s is number => s !== null);
  const lastWeekAvg = prevValidScores.length > 0
    ? Math.round(prevValidScores.reduce((a, b) => a + b, 0) / prevValidScores.length)
    : null;

  const totalMeditations = meditationData.reduce((sum, d) => sum + d.count, 0);

  const window_ = getCheckinWindow();
  const showMorningCTA = window_ === 'morning' && !morningCheckin;
  const showCheckoutCTA = window_ === 'checkout' && !checkoutCheckin;
  const showCTA = showMorningCTA || showCheckoutCTA;
  const ctaLabel = showMorningCTA ? '朝チェックイン' : '夜チェックアウト';

  const uniqueDays = new Set((checkins || []).map(c => c.checked_at.split('T')[0])).size;
  const hasEnoughData = uniqueDays >= 5;

  const diffColor = scoreDiff === null ? 'var(--color-text-subtle)'
    : scoreDiff > 0 ? 'var(--color-success)'
    : scoreDiff < 0 ? 'var(--color-warning)'
    : 'var(--color-text-subtle)';

  const weekDiff = thisWeekAvg !== null && lastWeekAvg !== null ? thisWeekAvg - lastWeekAvg : null;

  return (
    <>
      <div className="space-y-4">
        <PageHeader title="ダッシュボード" />

        {showCTA && (
          <CheckinCTABanner
            greeting=""
            ctaLabel={ctaLabel}
            timing={showMorningCTA ? 'morning' : 'checkout'}
          />
        )}

        {/* 上段：スコア | グラフ */}
        <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-4">

          {/* 今日のコンディション */}
          <Card className="flex flex-col p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">今日のコンディション</p>

            {latestCheckin ? (
              <>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-7xl font-extrabold leading-none tracking-tighter tabular-nums text-foreground">
                    {todayScore ?? '–'}
                  </span>
                  {scoreDiff !== null && (
                    <div className="flex flex-col gap-1 pb-2">
                      <span style={{
                        fontSize: '14px', fontWeight: 700,
                        color: diffColor,
                        background: scoreDiff > 0 ? 'var(--color-success-subtle)' : scoreDiff < 0 ? 'var(--color-warning-subtle)' : 'var(--color-surface-subtle)',
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        border: `1px solid ${scoreDiff > 0 ? 'var(--color-success)' : scoreDiff < 0 ? 'var(--color-warning)' : 'var(--color-border-default)'}`,
                      }}>
                        {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? '±0' : scoreDiff}
                      </span>
                      <span className="text-xs text-muted-foreground">前日比</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  {([
                    { Icon: Brain, label: '心', score: todayMindScore, color: 'var(--color-warning)', bg: 'var(--color-warning-subtle)', border: 'var(--color-warning)' },
                    { Icon: Activity, label: '体', score: todayBodyScore, color: 'var(--color-success)', bg: 'var(--color-success-subtle)', border: 'var(--color-success)' },
                  ] as const).map(({ Icon, label, score, color, bg, border }) => (
                    <div key={label} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 'var(--radius-lg)',
                      background: score !== null ? bg : 'var(--color-surface-subtle)',
                      border: `1px solid ${score !== null ? border : 'var(--color-border-default)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon size={13} strokeWidth={2} color={score !== null ? color : 'var(--color-text-subtle)'} />
                        <span style={{ fontSize: '13px', color: score !== null ? color : 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
                      </div>
                      <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.03em', color: score !== null ? color : 'var(--color-text-subtle)' }}>
                        {score ?? '–'}
                      </span>
                    </div>
                  ))}
                </div>

                {latestCheckin.ai_comment && (
                  <div className="border-t pt-4 flex-1">
                    <CareComment comment={latestCheckin.ai_comment} compact />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
                <div style={{
                  width: '52px', height: '52px', borderRadius: 'var(--radius-full)',
                  background: 'var(--color-success-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={22} strokeWidth={1.8} color="var(--color-success)" />
                </div>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  今日のチェックインが<br />まだありません
                </p>
              </div>
            )}
          </Card>

          {/* スコア推移グラフ */}
          <Card className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">スコア推移（7日間）</p>
              {thisWeekAvg !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    今週平均{' '}
                    <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '15px' }}>{thisWeekAvg}</span>
                  </span>
                  {weekDiff !== null && weekDiff !== 0 && (
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: weekDiff > 0 ? 'var(--color-success)' : 'var(--color-warning)',
                      background: weekDiff > 0 ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)',
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      border: `1px solid ${weekDiff > 0 ? 'var(--color-success)' : 'var(--color-warning)'}`,
                    }}>
                      {weekDiff > 0 ? `+${Math.round(weekDiff)}` : Math.round(weekDiff)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-[220px]">
              <ScoreLineChart data={scoreData} fillHeight />
            </div>
          </Card>
        </div>

        {/* 下段：瞑想 | 週次レポート */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">瞑想（7日間）</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">今週</span>
                <span style={{
                  fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em',
                  color: totalMeditations > 0 ? 'var(--color-warning)' : 'var(--color-text-subtle)',
                }}>
                  {totalMeditations}回
                </span>
              </div>
            </div>
            <MeditationDots data={meditationData} />
          </Card>

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
