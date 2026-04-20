'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LoginPage } from '@takaki/go-design-system';
import Logo from '@/components/ui/Logo';

export default function LoginPageComponent() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  return (
    <LoginPage
      productName="CareGo"
      productLogo={<Logo size="lg" />}
      tagline="良いコンディションの安定を、毎日の記録とAIの気づきで作る。"
      onGoogleSignIn={handleGoogleLogin}
      isLoading={loading}
    />
  );
}
