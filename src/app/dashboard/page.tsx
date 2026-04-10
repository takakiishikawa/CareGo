import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sun, Moon, TrendingUp, Wind, Sparkles } from 'lucide-react';
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

  // 今日
  const todayCheckins = (checkins || []).filter(c => c.checked_at.startsWith(today));
  const morningCheckin = todayCheckins.find(c => c.timing === 'morning');
  const eveningCheckin = todayCheckins.find(c => c.timing === 'evening');
  const latestCheckin = eveningCheckin || morningCheckin;
  const ms = morningCheckin?.condition_score ?? null;
  const es = eveningCheckin?.condition_score ?? null;
  const todayScore = ms !== null && es !== null ? Math.round((ms + es) / 2) : ms ?? es ?? null;

  // 昨日
  const yesterdayStr = last7Days[last7Days.length - 2];
  const yesterdayCheckins = (checkins || []).filter(c => c.checked_at.startsWith(yesterdayStr));
  const ym = yesterdayCheckins.find(c => c.timing === 'morning')?.condition_score ?? null;
  const ye = yesterdayCheckins.find(c => c.timing === 'evening')?.condition_score ?? null;
  const yesterdayScore = ym !== null && ye !== null ? Math.round((ym + ye) / 2) : ym ?? ye ?? null;
  const scoreDiff = todayScore !== null && yesterdayScore !== null ? todayScore - yesterdayScore : null;

  // 7日間データ
  const scoreData: DailyScore[] = last7Days.map(date => {
    const day = (checkins || []).filter(c => c.checked_at.startsWith(date));
    const m = day.find(c => c.timing === 'morning')?.condition_score ?? null;
    const e = day.find(c => c.timing === 'evening')?.condition_score ?? null;
    const score = m !== null && e !== null ? Math.round((m + e) / 2) : m ?? e ?? null;
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

        {/* 本日のコンディション */}
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
          borderRadius: '14px', padding: '28px 28px 24px',
          boxShadow: 'var(--shadow-card)', marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '13px', color: 'var(--text-placeholder)', fontWeight: 500,
            marginBottom: '20px',
          }}>
            本日のコンディション
          </div>

          {morningCheckin || eveningCheckin ? (
            <>
              {/* ① 今日のスコア（大） */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  fontSize: '72px', fontWeight: 700, lineHeight: 1,
                  color: todayScore !== null ? 'var(--text-green-dark)' : 'var(--border-muted)',
                  letterSpacing: '-2px',
                }}>
                  {todayScore ?? '–'}
                </div>
                {scoreDiff !== null && (
                  <div style={{
                    fontSize: '15px', fontWeight: 600, marginTop: '8px',
                    color: diffColor,
                  }}>
                    {scoreDiff > 0 ? `▲ +${scoreDiff}` : scoreDiff < 0 ? `▼ ${scoreDiff}` : '±0'}
                    <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-placeholder)', marginLeft: '6px' }}>前日比</span>
                  </div>
                )}
              </div>

              {/* ② 朝・夜の内訳（横並び） */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '12px',
                marginBottom: latestCheckin?.ai_comment ? '20px' : '0',
              }}>
                {([
                  { Icon: Sun, label: '朝', score: ms },
                  { Icon: Moon, label: '夜', score: es },
                ] as const).map(({ Icon, label, score }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 18px', borderRadius: '10px',
                    background: 'var(--bg-subtle)',
                    border: '0.5px solid var(--border-color)',
                  }}>
                    <Icon size={13} strokeWidth={2} color="var(--text-placeholder)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>{label}</span>
                    <span style={{
                      fontSize: '22px', fontWeight: 600, lineHeight: 1,
                      color: score !== null ? 'var(--text-primary)' : 'var(--border-muted)',
                    }}>
                      {score ?? '–'}
                    </span>
                  </div>
                ))}
              </div>

              {/* ③ Coaのひとこと */}
              {latestCheckin?.ai_comment && (
                <div style={{
                  borderTop: '0.5px solid var(--border-color)',
                  paddingTop: '16px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', color: 'var(--text-green)', marginBottom: '6px', fontWeight: 600,
                  }}>
                    <Sparkles size={12} strokeWidth={2} />
                    Coa のひとこと
                  </div>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                    {latestCheckin.ai_comment}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '14px', color: 'var(--text-placeholder)' }}>
              本日のチェックインはまだありません
            </div>
          )}
        </div>

        {/* グラフ行 */}
        <div className="dashboard-grid">
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
            borderRadius: '14px', padding: '24px', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '14px', color: 'var(--text-placeholder)', fontWeight: 500 }}>
                <TrendingUp size={15} strokeWidth={2} color="var(--text-placeholder)" />
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
                  {(() => {
                    const d = thisWeekAvg - lastWeekAvg;
                    if (d === 0) return null;
                    return (
                      <span style={{
                        fontWeight: 600,
                        color: d > 0 ? 'var(--accent-green)' : 'var(--accent-amber)',
                        fontSize: '12px',
                      }}>
                        ({d > 0 ? `+${d}` : d})
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
            <ScoreLineChart data={scoreData} />
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
            borderRadius: '14px', padding: '24px', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              fontSize: '14px', color: 'var(--text-placeholder)', marginBottom: '20px', fontWeight: 500,
            }}>
              <Wind size={15} strokeWidth={2} color="var(--text-placeholder)" />
              瞑想回数（7日間）
            </div>
            <MeditationLineChart data={meditationData} />
          </div>
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
