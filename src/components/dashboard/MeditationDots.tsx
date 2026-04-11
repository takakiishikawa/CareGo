'use client';

import { DailyMeditation } from '@/lib/types';

interface MeditationDotsProps {
  data: DailyMeditation[];
}

export default function MeditationDots({ data }: MeditationDotsProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', paddingBottom: '4px', overflow: 'visible' }}>
      {data.map(d => {
        const isToday = d.date === today;
        const date = new Date(d.date + 'T00:00:00');
        const label = isToday ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`;

        // 2回以上=濃いオレンジ、1回=薄いオレンジ、0回=グレー
        const dotBg = d.count >= 2
          ? 'var(--accent-amber)'
          : d.count === 1
            ? '#F8D090'
            : 'var(--bg-muted)';
        const dotBorder = d.count >= 1 ? 'var(--accent-amber)' : 'var(--border-muted)';

        return (
          <div key={d.date} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}>
            {/* 回数ラベル */}
            <div style={{
              fontSize: '14px',
              fontWeight: d.count > 0 ? 600 : 400,
              color: d.count > 0 ? 'var(--text-primary)' : 'var(--text-placeholder)',
              height: '20px',
              display: 'flex', alignItems: 'center',
            }}>
              {d.count > 0 ? `${d.count}回` : '–'}
            </div>

            {/* ドット */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: dotBg,
              border: `1.5px solid ${dotBorder}`,
              flexShrink: 0,
            }} />

            {/* 日付ラベル */}
            <div style={{
              fontSize: '14px',
              color: isToday ? 'var(--accent-amber)' : 'var(--text-placeholder)',
              fontWeight: isToday ? 600 : 400,
              fontFamily: 'DM Sans, system-ui, sans-serif',
            }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
