'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sun, Moon, PenLine, LogOut } from 'lucide-react';
import Logo from './Logo';
import ProfileModal from './ProfileModal';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface TopNavProps {
  morningDone: boolean;
  eveningDone: boolean;
  profile: Profile | null;
  userId: string;
}

export default function TopNav({ morningDone, eveningDone, profile, userId }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = (profile?.display_name || 'U').charAt(0).toUpperCase();

  return (
    <>
      <header style={{ background: '#FFFFFF', borderBottom: '0.5px solid var(--border-color)' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 40px',
          height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Logo size="sm" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* チェックインステータス */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {([
                { key: 'morning', done: morningDone, Icon: Sun, label: '朝' },
                { key: 'evening', done: eveningDone, Icon: Moon, label: '夜' },
              ] as const).map(({ key, done, Icon, label }) => (
                <span key={key} style={{
                  fontSize: '12px', padding: '4px 10px 4px 8px', borderRadius: '9999px',
                  background: done ? '#E8F5EF' : '#EEECE8',
                  color: done ? '#1A5C3E' : '#6B6660',
                  border: `0.5px solid ${done ? '#9AD4B3' : '#D8D5CE'}`,
                  fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}>
                  <Icon size={11} strokeWidth={2.2} />
                  {label} {done ? '✓' : '–'}
                </span>
              ))}
            </div>

            {pathname !== '/checkin' && (
              <Link href="/checkin" style={{
                background: '#2D8A5F', color: 'white', borderRadius: '10px',
                padding: '7px 14px', fontSize: '14px', fontWeight: 500,
                textDecoration: 'none', transition: 'all 0.15s ease',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1A5C3E'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#2D8A5F'; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <PenLine size={14} strokeWidth={2} />
                チェックイン
              </Link>
            )}

            {/* アバター + 名前 */}
            <button
              onClick={() => setShowProfile(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: '0.5px solid var(--border-color)',
                borderRadius: '9999px', padding: '4px 12px 4px 4px',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#9AD4B3'; (e.currentTarget as HTMLElement).style.background = '#F8F6F2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#E8F5EF', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#2D8A5F' }}>{initials}</span>
                )}
              </div>
              <span style={{ fontSize: '14px', color: '#2E2B28', fontWeight: 500, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.display_name ?? 'プロフィール'}
              </span>
            </button>

            <button
              onClick={handleSignOut}
              style={{
                background: 'transparent', color: '#6B6660',
                border: '0.5px solid var(--border-color-hover)',
                borderRadius: '10px', padding: '7px 12px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8F6F2'; (e.currentTarget as HTMLElement).style.color = '#2E2B28'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6660'; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <LogOut size={14} strokeWidth={2} />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {showProfile && (
        <ProfileModal profile={profile} userId={userId} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}
