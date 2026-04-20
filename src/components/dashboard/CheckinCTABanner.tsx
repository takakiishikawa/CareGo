'use client';

import Link from 'next/link';
import { Sun, Moon, PenLine } from 'lucide-react';

interface CheckinCTABannerProps {
  greeting: string;
  ctaLabel: string;
  timing: 'morning' | 'checkout';
}

export default function CheckinCTABanner({ greeting, ctaLabel, timing }: CheckinCTABannerProps) {
  const CtaIcon = timing === 'morning' ? Sun : Moon;
  const isMorning = timing === 'morning';

  return (
    <div style={{
      background: isMorning
        ? 'var(--color-primary)'
        : 'var(--color-text-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      marginBottom: '20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 背景装飾 */}
      <div style={{
        position: 'absolute', right: '-20px', top: '-20px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CtaIcon size={20} strokeWidth={2} color="white" />
        </div>
        <div>
          {greeting && <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginBottom: '2px' }}>{greeting}</div>}
          <div style={{ color: 'white', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {ctaLabel}をしましょう
          </div>
        </div>
      </div>

      <Link href="/checkin" style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        color: 'white',
        borderRadius: 'var(--radius-md)',
        padding: '9px 18px',
        fontSize: '14px', fontWeight: 600,
        textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.18s ease',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        border: '1px solid rgba(255,255,255,0.25)',
        position: 'relative', letterSpacing: '-0.01em',
      }}>
        <PenLine size={14} strokeWidth={2.2} />
        記録する
      </Link>
    </div>
  );
}
