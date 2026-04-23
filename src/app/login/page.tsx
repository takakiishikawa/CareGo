"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoginPage } from "@takaki/go-design-system";

const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
    <path
      d="M14 2C14 2 5 10.5 5 17C5 21.9706 9.02944 26 14 26C18.9706 26 23 21.9706 23 17C23 10.5 14 2 14 2Z"
      fill="var(--color-primary, #2D8A5F)"
    />
    <path
      d="M14 26V17"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M10.5 20.5C10.5 18.567 12.067 17 14 17"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export default function LoginPageComponent() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  return (
    <LoginPage
      productName="CareGo"
      productLogo={<LeafIcon />}
      tagline="良いコンディションの安定を、毎日の記録とAIの気づきで作る。"
      onGoogleSignIn={handleGoogleLogin}
      isLoading={loading}
    />
  );
}
