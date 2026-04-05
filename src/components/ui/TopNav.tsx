'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sun, Moon, PenLine, LogOut, User, BookOpen, ChevronDown } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = (profile?.display_name || 'U').charAt(0).toUpperCase();

  // メニュー外クリックで閉じる
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

  const menuItems = [
    {
      label: 'プロフィール',
      icon: <User size={14} strokeWidth={2} />,
      onClick: () => { setMenuOpen(false); setShowProfile(true); },
    },
    {
      label: 'コンセプト',
      icon: <BookOpen size={14} strokeWidth={2} />,
      href: '/concept',
      onClick: () => setMenuOpen(false),
    },
    {
      label: 'ログアウト',
      icon: <LogOut size={14} strokeWidth={2} />,
      onClick: handleSignOut,
      danger: true,
    },
  ];

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

            {/* プロフィールボタン + ドロップダウン */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: menuOpen ? '#F8F6F2' : 'none',
                  border: `0.5px solid ${menuOpen ? '#9AD4B3' : 'var(--border-color)'}`,
                  borderRadius: '9999px', padding: '4px 10px 4px 4px',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!menuOpen) { (e.currentTarget as HTMLElement).style.borderColor = '#9AD4B3'; (e.currentTarget as HTMLElement).style.background = '#F8F6F2'; } }}
                onMouseLeave={e => { if (!menuOpen) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.background = 'none'; } }}
              >
                {/* アバター */}
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
                  {profile?.display_name ?? 'メニュー'}
                </span>
                <ChevronDown
                  size={13}
                  strokeWidth={2.2}
                  color="#A09B92"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }}
                />
              </button>

              {/* ドロップダウンメニュー */}
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#FFFFFF',
                  border: '0.5px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                  width: '168px',
                  overflow: 'hidden',
                  zIndex: 100,
                  animation: 'fadeInDown 0.12s ease',
                }}>
                  {menuItems.map((item, i) => {
                    const el = (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '11px 16px',
                          background: 'none', border: 'none',
                          borderTop: i > 0 ? '0.5px solid var(--border-color)' : 'none',
                          fontSize: '14px', fontWeight: 500,
                          color: item.danger ? '#C0392B' : '#2E2B28',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = item.danger ? '#FDF3E3' : '#F8F6F2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span style={{ color: item.danger ? '#C0392B' : '#A09B92', display: 'flex' }}>{item.icon}</span>
                        {item.label}
                      </button>
                    );

                    // コンセプトはLinkでラップ
                    if (item.href) {
                      return (
                        <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }} onClick={item.onClick}>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '11px 16px',
                            borderTop: i > 0 ? '0.5px solid var(--border-color)' : 'none',
                            fontSize: '14px', fontWeight: 500, color: '#2E2B28',
                            transition: 'background 0.12s ease',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8F6F2'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                          >
                            <span style={{ color: '#A09B92', display: 'flex' }}>{item.icon}</span>
                            {item.label}
                          </span>
                        </Link>
                      );
                    }
                    return el;
                  })}
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
