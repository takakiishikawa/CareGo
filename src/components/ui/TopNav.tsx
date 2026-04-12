'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sun, Moon, PenLine, LogOut, User, BookOpen, ChevronDown } from 'lucide-react';
import Logo from './Logo';
import ProfileModal from './ProfileModal';
import { useTheme } from './ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = (profile?.display_name || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <header style={{ background: 'var(--bg-card)', borderBottom: '0.5px solid var(--border-color)' }}>
        <div className="nav-inner">
          <Logo size="sm" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* チェックインステータス */}
            <div className="nav-checkin-status" style={{ display: 'flex', gap: '6px' }}>
              {([
                { key: 'morning', done: morningDone, Icon: Sun, label: '朝' },
                { key: 'evening', done: eveningDone, Icon: Moon, label: '夜' },
              ] as const).map(({ key, done, Icon, label }) => (
                <span key={key} style={{
                  fontSize: '12px', padding: '4px 10px 4px 8px', borderRadius: '9999px',
                  background: done ? 'var(--bg-green)' : 'var(--bg-muted)',
                  color: done ? 'var(--text-green-dark)' : 'var(--text-muted)',
                  border: `0.5px solid ${done ? 'var(--border-green)' : 'var(--border-muted)'}`,
                  fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}>
                  <Icon size={11} strokeWidth={2.2} />
                  {label} {done ? '✓' : '–'}
                </span>
              ))}
            </div>

            {/* テーマ切り替えボタン */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'transparent',
                border: '0.5px solid var(--border-color)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                color: 'var(--text-placeholder)',
                flexShrink: 0,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
            >
              {theme === 'dark'
                ? <Sun size={15} strokeWidth={2} />
                : <Moon size={15} strokeWidth={2} />
              }
            </button>

            {pathname !== '/checkin' && (
              <Link href="/checkin"
                className="nav-checkin-link"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-green-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-green)'; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                <span className="nav-checkin-icon"><PenLine size={14} strokeWidth={2} /></span>
                チェックイン
              </Link>
            )}

            {/* プロフィールボタン + ドロップダウン */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: menuOpen ? 'var(--bg-subtle)' : 'transparent',
                  border: `0.5px solid ${menuOpen ? 'var(--border-green)' : 'var(--border-color)'}`,
                  borderRadius: '9999px', padding: '4px 10px 4px 4px',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!menuOpen) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-green)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; } }}
                onMouseLeave={e => { if (!menuOpen) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--bg-green)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-green)' }}>{initials}</span>
                  )}
                </div>
                <span className="nav-profile-name" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.display_name ?? 'メニュー'}
                </span>
                <ChevronDown
                  size={13}
                  strokeWidth={2.2}
                  color="var(--text-placeholder)"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }}
                />
              </button>

              {/* ドロップダウンメニュー */}
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-card)',
                  border: '0.5px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-dropdown)',
                  width: '188px',
                  overflow: 'hidden',
                  zIndex: 100,
                  animation: 'fadeInDown 0.12s ease',
                }}>

                  {/* プロフィール */}
                  <button
                    onClick={() => { setMenuOpen(false); setShowProfile(true); }}
                    style={itemStyle(false)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: 'var(--text-placeholder)', display: 'flex' }}><User size={14} strokeWidth={2} /></span>
                    プロフィール
                  </button>

                  {/* コンセプト */}
                  <Link
                    href="/concept"
                    style={{ textDecoration: 'none' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span style={{
                      ...itemStyle(false),
                      borderTop: '0.5px solid var(--border-color)',
                      display: 'flex',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-placeholder)', display: 'flex' }}><BookOpen size={14} strokeWidth={2} /></span>
                      コンセプト
                    </span>
                  </Link>

                  {/* ログアウト */}
                  <button
                    onClick={handleSignOut}
                    style={{ ...itemStyle(true), borderTop: '0.5px solid var(--border-color)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-amber)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: 'var(--text-error)', display: 'flex' }}><LogOut size={14} strokeWidth={2} /></span>
                    ログアウト
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showProfile && (
        <ProfileModal profile={profile} userId={userId} onClose={() => setShowProfile(false)} />
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

const itemStyle = (danger: boolean): React.CSSProperties => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '11px 16px',
  background: 'transparent',
  border: 'none',
  fontSize: '14px',
  fontWeight: 500,
  color: danger ? 'var(--text-error)' : 'var(--text-secondary)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.12s ease',
});
