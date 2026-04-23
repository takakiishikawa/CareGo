"use client";

import Link from "next/link";
import { Sun, Moon, PenLine } from "lucide-react";
import { Button } from "@takaki/go-design-system";

interface CheckinCTABannerProps {
  greeting: string;
  ctaLabel: string;
  timing: "morning" | "checkout";
}

export default function CheckinCTABanner({
  greeting,
  ctaLabel,
  timing,
}: CheckinCTABannerProps) {
  const CtaIcon = timing === "morning" ? Sun : Moon;
  const isMorning = timing === "morning";

  return (
    <div
      style={{
        background: isMorning ? "var(--color-primary)" : "var(--foreground)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 背景装飾 */}
      <div
        style={{
          position: "absolute",
          right: "-20px",
          top: "-20px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "var(--color-overlay-light)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-overlay-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CtaIcon size={20} strokeWidth={2} color="white" />
        </div>
        <div>
          {greeting && (
            <div
              style={{
                color: "var(--color-text-tertiary)",
                fontSize: "var(--text-xs)",
                marginBottom: "2px",
              }}
            >
              {greeting}
            </div>
          )}
          <div
            style={{
              color: "var(--color-text-primary)",
              fontSize: "var(--text-base)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {ctaLabel}をしましょう
          </div>
        </div>
      </div>

      <Button
        asChild
        className="text-white shrink-0"
        style={
          {
            background: "var(--color-overlay-light)",
            border: "1px solid var(--color-overlay-medium)",
          } as React.CSSProperties
        }
      >
        <Link href="/checkin">
          <PenLine size={14} strokeWidth={2.2} />
          記録する
        </Link>
      </Button>
    </div>
  );
}