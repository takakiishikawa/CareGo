'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sun, Moon, PenLine, LogOut, User, BookOpen, ChevronDown, BrainCircuit, LayoutGrid, ChevronUp } from 'lucide-react';
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

const GO_APPS = [
  { name: 'NativeGo',   url: 'https://english-learning-app-black.vercel.app/',  color: '#E5484D' },
  { name: 'CareGo',     url: 'https://care-go-mu.vercel.app/dashboard',          color: '#30A46C' },
  { name: 'KenyakuGo',  url: 'https://kenyaku-go.vercel.app/',                   color: '#F5A623' },
  { name: 'TaskGo',     url: 'https://taskgo-dun.vercel.app/',                   color: '#5E6AD2' },
  { name: 'CookGo',     url: 'https://cook-go-lovat.vercel.app/dashboard',       color: '#1AD1A5' },
  { name: 'PhysicalGo', url: 'https://physical-go.vercel.app/dashboard',         color: '#FF6B6B' },
] as const;

const CURRENT_APP = 'CareGo';

export default function TopNav({ morningDone, eveningDone, profile, userId }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showApps, setShowApps] = useState(false);
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

  const bothDone = morningDone && eveningDone;
  const noneDone = !morningDone && !eveningDone;

  return (
    <>
      <header className="nav-outer">
        <div className="nav-inner">
          <Logo size="sm" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* チェックインバッジ */}
            <div className="nav-checkin-status" style={{ display: 'flex', gap: '5px' }}>
              {([
                { key: 'morning', done: morningDone, Icon: Sun, label: 'チェックイン' },
                { key: 'evening', done: eveningDone, Icon: Moon, label: 'チェックアウト' },
              ] as const).map(({ key, done, Icon, label }) => (
                <span key={key} style={{
                  fontSize: '12px', padding: '4px 10px 4px 7px', borderRadius: 'var(--radius-full)',
                  background: done ? 'var(--bg-green)' : 'var(--bg-subtle)',
                  color: done ? 'var(--text-green)' : 'var(--text-placeholder)',
                  border: `1px solid ${done ? 'var(--border-green)' : 'var(--border-color)'}`,
                  fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px',
                  letterSpacing: '-0.01em',
                }}>
                  <Icon size={11} strokeWidth={done ? 2.5 : 2} />
                  {label}{done ? ' ✓' : ''}
                </span>
              ))}
            </div>

            {/* ステータス要約（モバイル向け） */}
            {!noneDone && (
              <span className="nav-checkin-status-sm" style={{
                fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                background: bothDone ? 'var(--bg-green)' : 'var(--bg-subtle)',
                color: bothDone ? 'var(--text-green)' : 'var(--text-muted)',
                border: `1px solid ${bothDone ? 'var(--border-green)' : 'var(--border-color)'}`,
                fontWeight: 500, display: 'none',
              }}>
                {bothDone ? '✓ 完了' : '朝 ✓'}
              </span>
            )}

            {/* テーマ切り替え */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', borderRadius: 'var(--radius-full)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                color: 'var(--text-placeholder)',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-placeholder)';
              }}
            >
              {theme === 'dark'
                ? <Sun size={15} strokeWidth={2} />
                : <Moon size={15} strokeWidth={2} />
              }
            </button>

            {/* チェックインCTAボタン */}
            {pathname !== '/checkin' && (
              <Link href="/checkin" className="nav-checkin-link">
                <span className="nav-checkin-icon"><PenLine size={14} strokeWidth={2.2} /></span>
                チェックイン
              </Link>
            )}

            {/* プロフィール */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: menuOpen ? 'var(--bg-subtle)' : 'transparent',
                  border: `1px solid ${menuOpen ? 'var(--accent-green)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-full)', padding: '4px 10px 4px 4px',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!menuOpen) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color-hover)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
                  }
                }}
                onMouseLeave={e => {
                  if (!menuOpen) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {/* アバター */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-green)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: 'var(--shadow-green)',
                }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>{initials}</span>
                  )}
                </div>
                <span className="nav-profile-name" style={{
                  fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500,
                  maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}>
                  {profile?.display_name ?? 'メニュー'}
                </span>
                <ChevronDown
                  size={13} strokeWidth={2.2} color="var(--text-placeholder)"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }}
                />
              </button>

              {/* ドロップダウン */}
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-dropdown)',
                  width: '210px', overflow: 'hidden', zIndex: 100,
                  animation: 'fadeInDown 0.15s ease',
                }}>
                  <button onClick={() => { setMenuOpen(false); setShowProfile(true); }}
                    style={itemStyle(false)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: 'var(--text-placeholder)', display: 'flex' }}><User size={14} strokeWidth={2} /></span>
                    プロフィール
                  </button>

                  <Link href="/reports" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                    <span style={{ ...itemStyle(false), borderTop: '1px solid var(--border-color)', display: 'flex' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-placeholder)', display: 'flex' }}><BrainCircuit size={14} strokeWidth={2} /></span>
                      週次レポート
                    </span>
                  </Link>

                  <Link href="/concept" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                    <span style={{ ...itemStyle(false), borderTop: '1px solid var(--border-color)', display: 'flex' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-placeholder)', display: 'flex' }}><BookOpen size={14} strokeWidth={2} /></span>
                      コンセプト
                    </span>
                  </Link>

                  {/* Goシリーズ アプリ切り替え */}
                  <div style={{ borderTop: '1px solid var(--border-color)' }}>
                    {/* アプリ一覧（上方向に展開） */}
                    {showApps && (
                      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {GO_APPS.map(app => {
                          const isCurrent = app.name === CURRENT_APP;
                          return isCurrent ? (
                            <div key={app.name} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '9px 16px',
                              background: 'var(--bg-subtle)',
                              cursor: 'default',
                            }}>
                              <span style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: app.color, flexShrink: 0,
                                boxShadow: `0 0 0 2px ${app.color}33`,
                              }} />
                              <span style={{
                                fontSize: '13px', fontWeight: 600,
                                color: 'var(--text-secondary)', letterSpacing: '-0.01em', flex: 1,
                              }}>
                                {app.name}
                              </span>
                              <span style={{
                                fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em',
                                color: app.color, background: `${app.color}18`,
                                padding: '2px 7px', borderRadius: 'var(--radius-full)',
                                border: `1px solid ${app.color}40`,
                              }}>
                                NOW
                              </span>
                            </div>
                          ) : (
                            <a key={app.name} href={app.url} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '9px 16px', textDecoration: 'none',
                              color: 'var(--text-secondary)', transition: 'background 0.12s ease',
                            }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              <span style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: app.color, flexShrink: 0,
                              }} />
                              <span style={{
                                fontSize: '13px', fontWeight: 400,
                                letterSpacing: '-0.01em',
                              }}>
                                {app.name}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* トリガーボタン */}
                    <button
                      onClick={() => setShowApps(v => !v)}
                      style={{ ...itemStyle(false), width: '100%' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-placeholder)', display: 'flex' }}>
                        <LayoutGrid size={14} strokeWidth={2} />
                      </span>
                      <span style={{ flex: 1 }}>Goシリーズ</span>
                      <span style={{ color: 'var(--text-placeholder)', display: 'flex', transition: 'transform 0.15s ease', transform: showApps ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                        <ChevronUp size={13} strokeWidth={2} />
                      </span>
                    </button>
                  </div>

                  <button onClick={handleSignOut}
                    style={{ ...itemStyle(true), borderTop: '1px solid var(--border-color)' }}
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
  letterSpacing: '-0.01em',
});
