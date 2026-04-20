import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CheckinForm from '@/components/checkin/CheckinForm';
import { getCheckinTiming, getTodayHCM } from '@/lib/timing';
import Link from 'next/link';
import { CheckCircle, LayoutDashboard } from 'lucide-react';

export default async function CheckinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = getTodayHCM();

  const { data: todayCheckins } = await supabase.from('checkins').select('timing')
    .gte('checked_at', today + 'T00:00:00Z')
    .lte('checked_at', today + 'T23:59:59Z');

  const morningDone = (todayCheckins || []).some(c => c.timing === 'morning');
  // 後方互換: 旧データ 'evening' も checkout 扱い
  const checkoutDone = (todayCheckins || []).some(c => c.timing === 'checkout' || c.timing === 'evening');
  const timing = getCheckinTiming();
  const alreadyDone = timing === 'morning' ? morningDone : checkoutDone;

  const isMorning = timing === 'morning';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <main className="checkin-main">
        {alreadyDone ? (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '48px 32px',
            boxShadow: 'var(--shadow-md)', textAlign: 'center',
          }}>
            <div style={{
              width: '64px', height: '64px', background: 'var(--color-success-subtle)', borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <CheckCircle size={28} strokeWidth={2} color="var(--color-success)" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
              {isMorning ? '朝チェックイン' : '夜チェックアウト'}は完了済みです
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
              {isMorning && !checkoutDone
                ? '夜チェックアウトは19時以降にできます。'
                : '今日のチェックイン・アウトは完了しています。'}
            </p>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: 'var(--color-primary)', color: 'white',
              borderRadius: 'var(--radius-md)', padding: '12px 24px',
              fontSize: '15px', fontWeight: 600, textDecoration: 'none',
              letterSpacing: '-0.02em',
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
