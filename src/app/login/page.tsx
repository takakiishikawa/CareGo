'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F6F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '0.5px solid var(--border-color)',
        borderRadius: '20px',
        padding: '48px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '40px',
            color: '#2D8A5F',
            marginBottom: '12px',
            lineHeight: 1.1,
          }}>
            CareGo
          </h1>
          <p style={{ fontSize: '15px', color: '#6B6660', lineHeight: 1.7 }}>
            良いコンディションの安定を、<br />AIと一緒に作る。
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            background: '#2D8A5F',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '13px 24px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="white" opacity="0.9"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="white" opacity="0.8"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="white" opacity="0.7"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="white" opacity="0.6"/>
          </svg>
          Googleでログイン
        </button>

        <p style={{ marginTop: '24px', fontSize: '11px', color: '#A09B92' }}>
          毎日のコンディションを記録して、<br />パターンを発見しよう。
        </p>
      </div>
    </div>
  );
}
