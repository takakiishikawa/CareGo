import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTodayHCM } from '@/lib/timing';
import TopNav from '@/components/ui/TopNav';
import {
  Wind, Sun, Moon, CircleCheck, CircleX,
  ArrowRight, Sparkles, TrendingUp, Target,
} from 'lucide-react';

export default async function ConceptPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = getTodayHCM();
  const [{ data: todayCheckins }, { data: profile }] = await Promise.all([
    supabase.from('checkins').select('timing')
      .gte('checked_at', today + 'T00:00:00Z')
      .lte('checked_at', today + 'T23:59:59Z'),
    supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single(),
  ]);

  const morningDone = (todayCheckins || []).some(c => c.timing === 'morning');
  const eveningDone = (todayCheckins || []).some(c => c.timing === 'evening');

  const card: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border-color)',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: 'var(--shadow-card)',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-green)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '12px',
  };

  const body: React.CSSProperties = {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    lineHeight: 1.85,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word',
  };

  // ユーザーストーリーモデル
  const dailySteps = [
    { icon: <Sun size={18} strokeWidth={1.8} color="var(--text-amber)" />, label: 'チェックイン', sub: '朝・夜、気分と感情を記録', bg: 'var(--bg-amber)', border: 'var(--border-amber)' },
    { icon: <Sparkles size={18} strokeWidth={1.8} color="var(--text-green)" />, label: 'Coa フィードバック', sub: 'スコアと短いコメントを即時返す', bg: 'var(--bg-green)', border: 'var(--border-green)' },
    { icon: <Wind size={18} strokeWidth={1.8} color="#2980B9" />, label: '瞑想', sub: 'ログが自動記録される', bg: 'var(--bg-blue)', border: 'var(--border-blue)' },
  ];

  const weeklySteps = [
    { icon: <TrendingUp size={18} strokeWidth={1.8} color="var(--text-green)" />, label: 'Coa インサイト', sub: '週次データを自動分析', bg: 'var(--bg-green)', border: 'var(--border-green)' },
    { icon: <Sparkles size={18} strokeWidth={1.8} color="var(--text-amber)" />, label: 'パターン認識', sub: '傾向と気づきが可視化される', bg: 'var(--bg-amber)', border: 'var(--border-amber)' },
    { icon: <Target size={18} strokeWidth={1.8} color="var(--text-green)" />, label: '行動変化', sub: '気づきが習慣の改善につながる', bg: 'var(--bg-green)', border: 'var(--border-green)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <TopNav morningDone={morningDone} eveningDone={eveningDone} profile={profile} userId={user.id} />

      <main className="concept-main">

        {/* ドキュメントヘッダー */}
        <section style={{ marginBottom: '56px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '40px' }}>
            CareGo
          </h1>

          {/* コアバリュー */}
          <div style={{ marginBottom: '36px' }}>
            <p style={sectionLabel}>コアバリュー</p>
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              安定した良いコンディション
            </p>
          </div>

          {/* 背景・課題 */}
          <div>
            <p style={sectionLabel}>背景・課題</p>
            <p style={{ ...body, marginBottom: '20px' }}>
              コンディションが良い時、学習・仕事・人間関係、あらゆることがうまく回る。
              コンディションが落ちると、同じことをしても結果が出ない。
            </p>
            <div style={{
              padding: '16px 20px',
              background: 'var(--bg-green)', borderRadius: '10px',
              borderLeft: '3px solid var(--accent-green)',
            }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-green-dark)', lineHeight: 1.6 }}>
                コンディションを安定させることが、生活全体への最も効果的なアプローチである。
              </p>
            </div>
          </div>
        </section>

        {/* プロダクトスコープ */}
        <section style={{ marginBottom: '48px' }}>
          <p style={sectionLabel}>プロダクトスコープ</p>
          <div className="concept-scope-grid">
            <div style={{ ...card, borderTop: '3px solid var(--accent-green)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CircleCheck size={18} strokeWidth={2} color="var(--accent-green)" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-green-dark)' }}>解くこと</span>
              </div>
              <p style={{ ...body, fontSize: '14px', margin: 0 }}>
                日常のコンディションの波を観察・認識し、良い状態を安定させること。
              </p>
            </div>
            <div style={{ ...card, borderTop: '3px solid var(--border-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CircleX size={18} strokeWidth={2} color="var(--text-placeholder)" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>解かないこと</span>
              </div>
              <ul style={{ ...body, fontSize: '14px', color: 'var(--text-muted)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  '臨床的なメンタルヘルス疾患の治療・診断',
                  'カウンセリングや医療の代替',
                  '人とのつながりを直接増やすこと',
                  'やりたいことをやりたいに変えること',
                ].map(t => (
                  <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ marginTop: '4px', flexShrink: 0, color: 'var(--border-muted)' }}>—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ユーザーストーリー */}
        <section style={{ marginBottom: '48px' }}>
          <p style={sectionLabel}>ユーザーストーリー</p>
          <div style={{ ...card, padding: '24px' }}>
            {/* 毎日 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-placeholder)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                毎日
              </div>
              <div className="concept-flow-grid">
                {dailySteps.map((step, i) => (
                  <>
                    <div key={step.label} style={{
                      background: step.bg, border: `0.5px solid ${step.border}`,
                      borderRadius: '10px', padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {step.icon}
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', wordBreak: 'keep-all' }}>{step.label}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, wordBreak: 'keep-all' }}>{step.sub}</p>
                    </div>
                    {i < dailySteps.length - 1 && (
                      <span key={`arrow-d-${i}`} className="flow-arrow" style={{ display: 'flex', justifyContent: 'center' }}>
                        <ArrowRight size={14} strokeWidth={2} color="var(--border-muted)" />
                      </span>
                    )}
                  </>
                ))}
              </div>
            </div>

            {/* 区切り */}
            <div style={{ borderTop: '0.5px solid var(--border-color)', marginBottom: '20px' }} />

            {/* 毎週 */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-placeholder)', letterSpacing: '0.06em', marginBottom: '12px', textTransform: 'uppercase' }}>
                毎週（日曜日）
              </div>
              <div className="concept-flow-grid">
                {weeklySteps.map((step, i) => (
                  <>
                    <div key={step.label} style={{
                      background: step.bg, border: `0.5px solid ${step.border}`,
                      borderRadius: '10px', padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {step.icon}
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', wordBreak: 'keep-all' }}>{step.label}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, wordBreak: 'keep-all' }}>{step.sub}</p>
                    </div>
                    {i < weeklySteps.length - 1 && (
                      <span key={`arrow-w-${i}`} className="flow-arrow" style={{ display: 'flex', justifyContent: 'center' }}>
                        <ArrowRight size={14} strokeWidth={2} color="var(--border-muted)" />
                      </span>
                    )}
                  </>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 指標 */}
        <section>
          <p style={sectionLabel}>指標</p>
          <div style={card}>
            {/* 行動指標 → 結果指標 フロー */}
            <div className="concept-metrics-grid">

              {/* 行動指標 */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-placeholder)', marginBottom: '14px', letterSpacing: '0.04em' }}>
                  行動指標
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'チェックイン入力率', sub: '朝・夜', freq: '日単位', Icon: Sun },
                    { label: '瞑想実施回数', sub: '', freq: '週単位', Icon: Wind },
                  ].map(({ label, sub, freq, Icon }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 14px', background: 'var(--bg-subtle)', borderRadius: '10px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={14} strokeWidth={2} color="var(--text-green)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</div>
                          {sub && <div style={{ fontSize: '11px', color: 'var(--text-placeholder)' }}>{sub}</div>}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px', color: 'var(--text-green)', fontWeight: 500,
                        background: 'var(--bg-green)', padding: '2px 8px', borderRadius: '9999px',
                      }}>{freq}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 矢印 */}
              <div className="metrics-arrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <ArrowRight size={18} strokeWidth={1.8} color="var(--border-muted)" />
                <div style={{ fontSize: '10px', color: 'var(--text-placeholder)', textAlign: 'center', lineHeight: 1.4, maxWidth: '48px' }}>
                  継続で
                </div>
              </div>

              {/* 結果指標 */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-placeholder)', marginBottom: '14px', letterSpacing: '0.04em' }}>
                  結果指標
                </div>
                <div style={{
                  padding: '18px 20px',
                  background: 'var(--bg-green)', borderRadius: '10px',
                  border: '0.5px solid var(--border-green)',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-green-dark)', marginBottom: '6px' }}>
                    週次スコア平均の安定・向上
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-green)', margin: 0, lineHeight: 1.6 }}>
                    コンディションスコアの週次平均値が<br />継続的に高く安定していること
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
