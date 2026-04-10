import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CheckinForm from '@/components/checkin/CheckinForm';
import TopNav from '@/components/ui/TopNav';
import { getCheckinTiming, getTodayHCM } from '@/lib/timing';
import Link from 'next/link';
import { CheckCircle, LayoutDashboard } from 'lucide-react';

export default async function CheckinPage() {
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
  const timing = getCheckinTiming();
  const alreadyDone = timing === 'morning' ? morningDone : eveningDone;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <TopNav morningDone={morningDone} eveningDone={eveningDone} profile={profile} userId={user.id} />

      <main className="checkin-main">
        {alreadyDone ? (
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
            borderRadius: '14px', padding: '48px 32px',
            boxShadow: 'var(--shadow-card)', textAlign: 'center',
          }}>
            <div style={{
              width: '60px', height: '60px', background: 'var(--bg-green)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <CheckCircle size={28} strokeWidth={1.8} color="var(--accent-green)" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-green-dark)', marginBottom: '12px' }}>
              {timing === 'morning' ? '朝のチェックイン' : '夜のチェックイン'}は完了済みです
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {timing === 'morning' && !eveningDone
                ? '夜のチェックインは夜以降にできます。'
                : '今日のチェックインは完了しています。お疲れさまでした。'}
            </p>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '24px',
              background: 'var(--accent-green)', color: 'white', borderRadius: '10px',
              padding: '11px 24px', fontSize: '16px', fontWeight: 500, textDecoration: 'none',
            }}>
              <LayoutDashboard size={15} strokeWidth={2} />
              ダッシュボードへ
            </Link>
          </div>
        ) : (
          <CheckinForm timing={timing} />
        )}
      </main>
    </div>
  );
}
