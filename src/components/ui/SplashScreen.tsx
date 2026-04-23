"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    if (!isPWA) return;

    setVisible(true);
    const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
    const hideTimer = setTimeout(() => setVisible(false), 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: "none",
      }}
    >
      {/* 背景グラデーション円 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
            opacity: 0.08,
            transform: "translate(-30%, -30%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "5%",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
            opacity: 0.1,
            transform: "translate(20%, 20%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "55%",
            left: "50%",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--color-success) 0%, transparent 70%)",
            opacity: 0.07,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* 中央コンテンツ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            filter:
              "drop-shadow(0 8px 24px rgba(0,0,0,0.15)) drop-shadow(0 2px 6px rgba(0,0,0,0.08))",
            marginBottom: "16px",
          }}
        >
          <svg
            width={96}
            height={96}
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14 2C14 2 5 10.5 5 17C5 21.9706 9.02944 26 14 26C18.9706 26 23 21.9706 23 17C23 10.5 14 2 14 2Z"
              fill="var(--color-primary)"
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
        </div>

        <div
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--color-primary)",
            fontFamily: '"DM Sans", system-ui, sans-serif',
            letterSpacing: "0.05em",
            marginBottom: "8px",
            lineHeight: 1,
          }}
        >
          CareGo
        </div>

        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-subtle)",
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          良いコンディションを、一緒に作る。
        </div>
      </div>

      {/* ローディングドット */}
      <div
        style={{
          position: "absolute",
          bottom: "72px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--color-primary)",
              opacity: 0.4,
              animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
          40% { transform: scale(1.4); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
