import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTodayHCM } from '@/lib/timing';
import TopNav from '@/components/ui/TopNav';
import {
  Eye, Lightbulb, Wind, ArrowDown,
  Sun, Moon, Target, BarChart3,
  CircleCheck, CircleX,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

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

  // ---- スタイル定数 ----
  const card = {
    background: '#FFFFFF',
    border: '0.5px solid var(--border-color)',
    borderRadius: '14px',
    padding: '28px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  } as const;

  const sectionLabel = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2D8A5F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '12px',
  };

  const h2 = {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1A1815',
    marginBottom: '16px',
    lineHeight: 1.35,
  };

  const body = {
    fontSize: '16px',
    color: '#2E2B28',
    lineHeight: 1.85,
  };

  const pillars = [
    {
      icon: <Eye size={22} strokeWidth={1.8} color="#2D8A5F" />,
      label: '観察する',
      desc: '自分の状態をリアルタイムで把握する',
      means: '朝晩チェックイン',
      bg: '#E8F5EF',
    },
    {
      icon: <Lightbulb size={22} strokeWidth={1.8} color="#C07818" />,
      label: '気づく',
      desc: 'パターンと傾向を理解する',
      means: 'AIインサイト・スコア推移',
      bg: '#FDF3E3',
    },
    {
      icon: <Wind size={22} strokeWidth={1.8} color="#2980B9" />,
      label: '整える',
      desc: '瞑想との連携で状態を回復させる',
      means: '瞑想ログ・誘導',
      bg: '#EAF4FB',
    },
  ];

  const userStory = [
    { icon: <Sun size={16} strokeWidth={2} color="#C07818" />, text: '朝の瞑想前にチェックイン（気分・感情を記録）', color: '#FDF3E3', border: '#FAE0B0' },
    { icon: <span style={{ fontSize: '14px' }}>✨</span>, text: 'Coaがスコアと短いコメントを即時返す', color: '#E8F5EF', border: '#9AD4B3' },
    { icon: <Wind size={16} strokeWidth={2} color="#2980B9" />, text: '瞑想に進む（ログが自動記録される）', color: '#EAF4FB', border: '#AED6F1' },
    { icon: <Moon size={16} strokeWidth={2} color="#6B6660" />, text: '夜の瞑想前に再度チェックイン', color: '#EEECE8', border: '#D8D5CE' },
    { icon: <BarChart3 size={16} strokeWidth={2} color="#2D8A5F" />, text: '1日のスコアが確定・グラフに反映', color: '#E8F5EF', border: '#9AD4B3' },
    { icon: <span style={{ fontSize: '14px' }}>🔁</span>, text: '毎週日曜日にCoaが週次インサイトを生成', color: '#FDF3E3', border: '#FAE0B0' },
    { icon: <Target size={16} strokeWidth={2} color="#2D8A5F" />, text: 'パターンへの気づきが行動変化につながる', color: '#E8F5EF', border: '#9AD4B3' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6F2' }}>
      <TopNav morningDone={morningDone} eveningDone={eveningDone} profile={profile} userId={user.id} />

      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '52px 40px 80px' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <Logo size="lg" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A1815', lineHeight: 1.3, marginBottom: '16px' }}>
            良いコンディションの安定を、<br />AIと一緒に作る。
          </h1>
          <p style={{ fontSize: '16px', color: '#6B6660', lineHeight: 1.75, maxWidth: '480px', margin: '0 auto' }}>
            毎日の気分・感情を記録し、AIがパターンを分析してインサイトを返す。
            瞑想との連携で習慣化を促す、自分だけのコンディション管理アプリ。
          </p>
        </section>

        {/* プロダクトスコープ */}
        <section style={{ marginBottom: '48px' }}>
          <p style={sectionLabel}>プロダクトスコープ</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* 解くこと */}
            <div style={{ ...card, borderTop: '3px solid #2D8A5F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CircleCheck size={18} strokeWidth={2} color="#2D8A5F" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A5C3E' }}>解くこと</span>
              </div>
              <p style={{ ...body, fontSize: '14px', color: '#2E2B28' }}>
                日常のコンディションの波を観察・認識し、良い状態を安定させること。
              </p>
            </div>
            {/* 解かないこと */}
            <div style={{ ...card, borderTop: '3px solid #D8D5CE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CircleX size={18} strokeWidth={2} color="#A09B92" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#6B6660' }}>解かないこと</span>
              </div>
              <ul style={{ ...body, fontSize: '14px', color: '#6B6660', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  '臨床的なメンタルヘルス疾患の治療・診断',
                  'カウンセリングや医療の代替',
                  '人とのつながりを直接増やすこと',
                  'やりたいことをやりたいに変えること',
                ].map(t => (
                  <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ marginTop: '4px', flexShrink: 0, color: '#D8D5CE' }}>—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 課題仮説 */}
        <section style={{ marginBottom: '48px' }}>
          <p style={sectionLabel}>課題仮説</p>
          <div style={{ ...card, background: '#F8F6F2', border: '0.5px solid #D8D5CE' }}>
            <p style={{ ...body, margin: 0 }}>
              「やらないといけない」駆動の行動が多い状態と、日常的な人とのつながりが少ない孤独感が重なることで、
              <strong style={{ color: '#1A1815' }}>慢性的なストレスが蓄積する。</strong>
              その結果、コンディションが不安定になり、英語学習・筋トレ・仕事・人間関係など生活のあらゆる領域でパフォーマンスが落ちる。
            </p>
            <div style={{
              marginTop: '20px', padding: '16px 20px',
              background: '#E8F5EF', borderRadius: '10px',
              borderLeft: '3px solid #2D8A5F',
            }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A5C3E', lineHeight: 1.6 }}>
                良い状態の時は全てがうまく回る。<br />
                だから、良い状態を安定させることが最も上流の解決策である。
              </p>
            </div>
          </div>
        </section>

        {/* 3つの軸 */}
        <section style={{ marginBottom: '48px' }}>
          <p style={sectionLabel}>コンディションを安定させる3つの軸</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {pillars.map(p => (
              <div key={p.label} style={{ ...card }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  {p.icon}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1A1815', marginBottom: '8px' }}>
                  {p.label}
                </div>
                <p style={{ fontSize: '14px', color: '#6B6660', lineHeight: 1.6, marginBottom: '14px' }}>
                  {p.desc}
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#F8F6F2', borderRadius: '6px',
                  padding: '5px 10px', fontSize: '12px', fontWeight: 500, color: '#2E2B28',
                }}>
                  {p.means}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ユーザーストーリー */}
        <section style={{ marginBottom: '48px' }}>
          <p style={sectionLabel}>ユーザーストーリー</p>
          <div style={{ ...card }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {userStory.map((step, i) => (
                <div key={i}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: '10px',
                    background: step.color, border: `0.5px solid ${step.border}`,
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: '12px', fontWeight: 600, color: '#6B6660',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      {step.icon}
                      <span style={{ fontSize: '14px', color: '#2E2B28', lineHeight: 1.5 }}>{step.text}</span>
                    </div>
                  </div>
                  {i < userStory.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                      <ArrowDown size={14} strokeWidth={2} color="#D8D5CE" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 指標 */}
        <section>
          <p style={sectionLabel}>指標</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* 行動指標 */}
            <div style={card}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E2B28', marginBottom: '16px' }}>
                行動指標
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'チェックイン入力率（朝・夜）', freq: '日単位', Icon: Sun },
                  { label: '瞑想実施回数', freq: '週単位', Icon: Wind },
                ].map(({ label, freq, Icon }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: '#F8F6F2', borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={14} strokeWidth={2} color="#2D8A5F" />
                      <span style={{ fontSize: '14px', color: '#2E2B28' }}>{label}</span>
                    </div>
                    <span style={{
                      fontSize: '12px', color: '#2D8A5F', fontWeight: 500,
                      background: '#E8F5EF', padding: '3px 8px', borderRadius: '9999px',
                    }}>{freq}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 結果指標 */}
            <div style={{ ...card, borderLeft: '3px solid #2D8A5F' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E2B28', marginBottom: '16px' }}>
                結果指標
              </div>
              <p style={{ fontSize: '15px', color: '#2E2B28', lineHeight: 1.75, margin: 0 }}>
                コンディションスコアの週次平均値が、以前より
                <strong style={{ color: '#1A5C3E' }}> 安定して高くなること。</strong>
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
