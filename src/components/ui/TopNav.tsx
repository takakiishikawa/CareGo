'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TopNavProps {
  morningDone: boolean;
  eveningDone: boolean;
}

export default function TopNav({ morningDone, eveningDone }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header style={{ background: '#FFFFFF', borderBottom: '0.5px solid var(--border-color)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontSize: '20px', color: '#2D8A5F', letterSpacing: '-0.3px' }}>
            CareGo
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* チェックインステータスインジケーター */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: morningDone ? '#E8F5EF' : '#EEECE8',
              color: morningDone ? '#1A5C3E' : '#6B6660',
              border: `0.5px solid ${morningDone ? '#9AD4B3' : '#D8D5CE'}`,
            }}>
              朝 {morningDone ? '✓' : '–'}
            </span>
            <span style={{
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: eveningDone ? '#E8F5EF' : '#EEECE8',
              color: eveningDone ? '#1A5C3E' : '#6B6660',
              border: `0.5px solid ${eveningDone ? '#9AD4B3' : '#D8D5CE'}`,
            }}>
              夜 {eveningDone ? '✓' : '–'}
            </span>
          </div>

          {pathname !== '/checkin' && (
            <Link href="/checkin" style={{
              background: '#2D8A5F',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}>
              チェックイン
            </Link>
          )}

          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              color: '#6B6660',
              border: '0.5px solid var(--border-color-hover)',
              borderRadius: '10px',
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
