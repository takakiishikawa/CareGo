import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sun, Moon, TrendingUp, Wind, Sparkles, Activity, PenLine } from 'lucide-react';
import TopNav from '@/components/ui/TopNav';
import ScoreLineChart from '@/components/dashboard/ScoreLineChart';
import MeditationLineChart from '@/components/dashboard/MeditationLineChart';
import WeeklyInsightCard from '@/components/dashboard/WeeklyInsightCard';
import InsightPopup from '@/components/dashboard/InsightPopup';
import { DailyScore, DailyMeditation } from '@/lib/types';
import { getCheckinWindow, getHCMHour, getLast7DaysHCM, getTodayHCM } from '@/lib/timing';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = getTodayHCM();
  const last7Days = getLast7DaysHCM();
  const sevenDaysAgo = last7Days[0];

  const [
    { data: checkins },
    { data: meditationLogs },
    { data: profile },
  ] = await Promise.all([
    supabase.from('checkins').select('*').gte('checked_at', sevenDaysAgo + 'T00:00:00Z').order('checked_at', { ascending: false }),
    supabase.from('meditation_logs').select('*').gte('logged_at', sevenDaysAgo + 'T00:00:00Z'),
    supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single(),
  ]);

  // 週次インサイト
  const now = new Date();
  const dow = now.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(now.getTime() + 7 * 3600000);
  weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const { data: weeklyInsight } = await supabase
    .from('weekly_insights').select('*').eq('week_start', weekStartStr).single();

  // 今日のチェックイン
  const todayCheckins = (checkins || []).filter(c => c.checked_at.startsWith(today));
  const morningCheckin = todayCheckins.find(c => c.timing === 'morning');
  const eveningCheckin = todayCheckins.find(c => c.timing === 'evening');
  const latestCheckin = eveningCheckin || morningCheckin;

  const ms = morningCheckin?.condition_score ?? null;
  const es = eveningCheckin?.condition_score ?? null;
  const todayScore = ms !== null && es !== null ? Math.round((ms + es) / 2) : ms ?? es ?? null;

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
  const weekAvg = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  // CTA表示判定
  const window_ = getCheckinWindow();
  const showMorningCTA = window_ === 'morning' && !morningCheckin;
  const showEveningCTA = window_ === 'evening' && !eveningCheckin;
  const showCTA = showMorningCTA || showEveningCTA;

  const hcmHour = getHCMHour();
  const greeting = hcmHour < 12 ? 'おはようございます。' : 'お疲れさまでした。';
  const ctaLabel = showMorningCTA ? '朝のチェックイン' : '夜のチェックイン';
  const ctaIcon = showMorningCTA ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />;

  // Insight popup
  const uniqueDays = new Set((checkins || []).map(c => c.checked_at.split('T')[0])).size;
  const hasEnoughData = uniqueDays >= 5;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6F2' }}>
      <TopNav morningDone={!!morningCheckin} eveningDone={!!eveningCheckin} profile={profile} userId={user.id} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 40px 64px' }}>

        {/* チェックインCTA */}
        {showCTA && (
          <div style={{
            background: '#2D8A5F', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '4px' }}>{greeting}</div>
              <div style={{ color: 'white', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
                {ctaIcon}{ctaLabel}をしましょう
              </div>
            </div>
            <Link href="/checkin" style={{
              background: 'white', color: '#2D8A5F', borderRadius: '10px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8F5EF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
            >
              <PenLine size={14} strokeWidth={2} />
              チェックイン →
            </Link>
          </div>
        )}

        {/* 本日のコンディション */}
        <div style={{
          background: '#FFFFFF', border: '0.5px solid var(--border-color)',
          borderRadius: '14px', padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            fontSize: '14px', color: '#A09B92', marginBottom: '20px', fontWeight: 500,
          }}>
            <Activity size={15} strokeWidth={2} color="#A09B92" />
            本日のコンディション
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#A09B92', marginBottom: '4px' }}>総合スコア</div>
              <div style={{ fontSize: '48px', fontWeight: 600, lineHeight: 1, color: todayScore !== null ? '#1A5C3E' : '#D8D5CE' }}>
                {todayScore ?? '–'}
              </div>
              {todayScore !== null && <div style={{ fontSize: '14px', color: '#A09B92' }}>/ 100</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([
                { t: 'morning' as const, score: ms, Icon: Sun, label: '朝スコア' },
                { t: 'evening' as const, score: es, Icon: Moon, label: '夜スコア' },
              ]).map(({ t, score, Icon, label }) => (
                <div key={t} style={{ background: '#F8F6F2', borderRadius: '10px', padding: '10px 16px', minWidth: '128px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#A09B92', marginBottom: '4px' }}>
                    <Icon size={11} strokeWidth={2} />
                    {label}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#1A1815' }}>{score ?? '–'}</div>
                </div>
              ))}
            </div>

            {weekAvg !== null && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#A09B92', marginBottom: '4px' }}>週平均</div>
                <div style={{ fontSize: '32px', fontWeight: 600, color: '#2D8A5F' }}>{weekAvg}</div>
              </div>
            )}
          </div>

          {latestCheckin?.ai_comment && (
            <div style={{
              background: '#E8F5EF', borderLeft: '3px solid #4DAF80',
              borderRadius: '0 10px 10px 0', padding: '14px 16px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: '#2D8A5F', marginBottom: '6px', fontWeight: 600,
              }}>
                <Sparkles size={13} strokeWidth={2} />
                Coa のひとこと
              </div>
              <div style={{ fontSize: '14px', color: '#1A5C3E', lineHeight: 1.7 }}>{latestCheckin.ai_comment}</div>
            </div>
          )}

          {!morningCheckin && !eveningCheckin && (
            <div style={{ color: '#A09B92', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
              本日のチェックインはまだありません
            </div>
          )}
        </div>

        {/* グラフ行 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{
            background: '#FFFFFF', border: '0.5px solid var(--border-color)',
            borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              fontSize: '14px', color: '#A09B92', marginBottom: '20px', fontWeight: 500,
            }}>
              <TrendingUp size={15} strokeWidth={2} color="#A09B92" />
              コンディションスコア（7日間）
            </div>
            <ScoreLineChart data={scoreData} />
          </div>

          <div style={{
            background: '#FFFFFF', border: '0.5px solid var(--border-color)',
            borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              fontSize: '14px', color: '#A09B92', marginBottom: '20px', fontWeight: 500,
            }}>
              <Wind size={15} strokeWidth={2} color="#A09B92" />
              瞑想回数（7日間）
            </div>
            <MeditationLineChart data={meditationData} />
          </div>
        </div>

        {/* 週次インサイト */}
        <WeeklyInsightCard insight={weeklyInsight} />
      </main>

      <InsightPopup weekStartStr={weekStartStr} hasEnoughData={hasEnoughData} />
    </div>
  );
}
