import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TrendingUp, Wind } from 'lucide-react';
import CareComment from '@/components/ui/CareComment';
import TopNav from '@/components/ui/TopNav';
import ScoreLineChart from '@/components/dashboard/ScoreLineChart';
import MeditationLineChart from '@/components/dashboard/MeditationLineChart';
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

  // 先週比較用：14日前〜7日前
  const fourteenDaysAgoDate = new Date();
  fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);
  const fourteenDaysAgo = fourteenDaysAgoDate.toISOString().split('T')[0];

  const [
    { data: checkins },
    { data: prevWeekCheckins },
    { data: meditationLogs },
    { data: profile },
  ] = await Promise.all([
    supabase.from('checkins').select('*').gte('checked_at', sevenDaysAgo + 'T00:00:00Z').order('checked_at', { ascending: false }),
    supabase.from('checkins').select('condition_score').gte('checked_at', fourteenDaysAgo + 'T00:00:00Z').lt('checked_at', sevenDaysAgo + 'T00:00:00Z'),
    supabase.from('meditation_logs').select('*').gte('logged_at', sevenDaysAgo + 'T00:00:00Z'),
    supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single(),
  ]);

  const now = new Date();
  const dow = now.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(now.getTime() + 7 * 3600000);
  weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const { data: weeklyInsight } = await supabase
    .from('weekly_insights').select('*').eq('week_start', weekStartStr).single();

  // 今日：最新チェックイン（夜 > 朝）
  const todayCheckins = (checkins || []).filter(c => c.checked_at.startsWith(today));
  const morningCheckin = todayCheckins.find(c => c.timing === 'morning');
  const eveningCheckin = todayCheckins.find(c => c.timing === 'evening');
  const latestCheckin = eveningCheckin || morningCheckin;
  const todayScore = latestCheckin?.condition_score ?? null;

  // 昨日：最新チェックイン（夜 > 朝）
  const yesterdayStr = last7Days[last7Days.length - 2];
  const yesterdayCheckins = (checkins || []).filter(c => c.checked_at.startsWith(yesterdayStr));
  const yesterdayLatest =
    yesterdayCheckins.find(c => c.timing === 'evening') ||
    yesterdayCheckins.find(c => c.timing === 'morning');
  const yesterdayScore = yesterdayLatest?.condition_score ?? null;
  const scoreDiff = todayScore !== null && yesterdayScore !== null ? todayScore - yesterdayScore : null;

  // 7日間データ：1日1スコア（最新チェックインのスコア）
  const scoreData: DailyScore[] = last7Days.map(date => {
    const day = (checkins || []).filter(c => c.checked_at.startsWith(date));
    const m = day.find(c => c.timing === 'morning')?.condition_score ?? null;
    const e = day.find(c => c.timing === 'evening')?.condition_score ?? null;
    const score = e ?? m;
    return { date, score, morning_score: m, evening_score: e };
  });

  const meditationData: DailyMeditation[] = last7Days.map(date => ({
    date,
    count: (meditationLogs || []).filter(m => m.logged_at.startsWith(date)).length,
  }));

  const validScores = scoreData.filter(d => d.score !== null).map(d => d.score!);
  const thisWeekAvg = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  // 先週平均
  const prevValidScores = (prevWeekCheckins || [])
    .map(c => c.condition_score)
    .filter((s): s is number => s !== null);
  const lastWeekAvg = prevValidScores.length > 0
    ? Math.round(prevValidScores.reduce((a, b) => a + b, 0) / prevValidScores.length)
    : null;

  // 今週の瞑想合計
  const totalMeditations = meditationData.reduce((sum, d) => sum + d.count, 0);

  const window_ = getCheckinWindow();
  const showMorningCTA = window_ === 'morning' && !morningCheckin;
  const showEveningCTA = window_ === 'evening' && !eveningCheckin;
  const showCTA = showMorningCTA || showEveningCTA;
  const ctaLabel = showMorningCTA ? '朝のチェックイン' : '夜のチェックイン';

  const uniqueDays = new Set((checkins || []).map(c => c.checked_at.split('T')[0])).size;
  const hasEnoughData = uniqueDays >= 5;

  const diffColor = scoreDiff === null ? 'var(--text-placeholder)'
    : scoreDiff > 0 ? 'var(--accent-green)'
    : scoreDiff < 0 ? 'var(--accent-amber)'
    : 'var(--text-placeholder)';

  const weekDiff = thisWeekAvg !== null && lastWeekAvg !== null ? thisWeekAvg - lastWeekAvg : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <TopNav morningDone={!!morningCheckin} eveningDone={!!eveningCheckin} profile={profile} userId={user.id} />

      <main className="page-main">

        {showCTA && (
          <CheckinCTABanner
            greeting=""
            ctaLabel={ctaLabel}
            timing={showMorningCTA ? 'morning' : 'evening'}
          />
        )}

        {/* 上段：本日のコンディション | 瞑想回数 */}
        <div className="dashboard-top-grid">

          {/* 本日のコンディション */}
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
            borderRadius: '12px', padding: '24px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '13px', color: 'var(--text-placeholder)', fontWeight: 500,
              marginBottom: '20px',
            }}>
              本日のコンディション
            </div>

            {latestCheckin ? (
              <>
                {/* スコア数値 + 前日比バッジ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                  <div style={{
                    fontSize: '80px', fontWeight: 700, lineHeight: 1,
                    color: 'var(--text-green-dark)',
                    letterSpacing: '-3px',
                  }}>
                    {todayScore ?? '–'}
                  </div>
                  {scoreDiff !== null && (
                    <div style={{
                      fontSize: '15px', fontWeight: 600,
                      color: diffColor,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px',
                    }}>
                      <span>{scoreDiff > 0 ? `▲ +${scoreDiff}` : scoreDiff < 0 ? `▼ ${scoreDiff}` : '±0'}</span>
                      <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-placeholder)' }}>前日比</span>
                    </div>
                  )}
                </div>

                {/* 今週平均 + 先週比 インライン */}
                <div style={{
                  fontSize: '13px', color: 'var(--text-placeholder)',
                  marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  {thisWeekAvg !== null && (
                    <>
                      <span>
                        今週平均:{' '}
                        <span style={{ fontWeight: 600, color: 'var(--text-green)' }}>{thisWeekAvg}</span>
                      </span>
                      {weekDiff !== null && (
                        <span style={{
                          fontWeight: 600,
                          color: weekDiff > 0 ? 'var(--accent-green)' : weekDiff < 0 ? 'var(--accent-amber)' : 'var(--text-placeholder)',
                        }}>
                          先週比 {weekDiff > 0 ? `+${weekDiff}` : weekDiff === 0 ? '±0' : weekDiff}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* ひとこと */}
                {latestCheckin.ai_comment && (
                  <div style={{ borderTop: '0.5px solid var(--border-color)', paddingTop: '16px', flex: 1 }}>
                    <CareComment comment={latestCheckin.ai_comment} compact />
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '14px', color: 'var(--text-placeholder)' }}>
                本日のチェックインはまだありません
              </div>
            )}
          </div>

          {/* 瞑想回数 */}
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
            borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-card)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                fontSize: '13px', color: 'var(--text-placeholder)', fontWeight: 500,
              }}>
                <Wind size={14} strokeWidth={2} color="var(--text-placeholder)" />
                瞑想（7日間）
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-placeholder)' }}>
                今週{' '}
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
                  {totalMeditations}
                </span>
                回
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <MeditationLineChart data={meditationData} />
            </div>
          </div>
        </div>

        {/* コンディションスコアグラフ（フルワイド） */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
          borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-card)',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-placeholder)', fontWeight: 500 }}>
              <TrendingUp size={14} strokeWidth={2} color="var(--text-placeholder)" />
              コンディションスコア（7日間）
            </div>
            {thisWeekAvg !== null && lastWeekAvg !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-placeholder)' }}>
                  今週 <span style={{ color: 'var(--text-green)', fontWeight: 600 }}>{thisWeekAvg}</span>
                </span>
                <span style={{ color: 'var(--text-placeholder)' }}>
                  先週 <span style={{ fontWeight: 500 }}>{lastWeekAvg}</span>
                </span>
                {weekDiff !== null && weekDiff !== 0 && (
                  <span style={{
                    fontWeight: 600,
                    color: weekDiff > 0 ? 'var(--accent-green)' : 'var(--accent-amber)',
                    fontSize: '12px',
                  }}>
                    ({weekDiff > 0 ? `+${weekDiff}` : weekDiff})
                  </span>
                )}
              </div>
            )}
          </div>
          <ScoreLineChart data={scoreData} />
        </div>

        {/* 週次インサイト */}
        <WeeklyInsightCard
          insight={weeklyInsight}
          thisWeekAvg={thisWeekAvg}
          lastWeekAvg={lastWeekAvg}
        />
      </main>

      <InsightPopup weekStartStr={weekStartStr} hasEnoughData={hasEnoughData} />
    </div>
  );
}
