'use client';

import { Moon, Sunrise, Sun, CloudSun, Sunset, MoonStar, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { Rating, TimePeriodRatings, CheckinTiming } from '@/lib/types';

interface Period {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
}

const MORNING_PERIODS: Period[] = [
  { key: 'last_night', label: '昨夜', Icon: Moon },
  { key: 'this_morning', label: '今朝', Icon: Sunrise },
];

const EVENING_PERIODS: Period[] = [
  { key: 'morning', label: '午前', Icon: Sun },
  { key: 'afternoon', label: '午後', Icon: CloudSun },
  { key: 'evening', label: '夕方', Icon: Sunset },
  { key: 'night', label: '夜', Icon: MoonStar },
];

const PERIOD_LABELS: Record<string, [string, string, string]> = {
  last_night:   ['ぐっすり眠れた',     'まあまあだった',    'あまり眠れなかった'],
  this_morning: ['すっきり起きられた', '普通',              'だるかった'],
  morning:      ['集中できた',          '普通',              '集中できなかった'],
  afternoon:    ['エネルギーがあった',  '普通',              'エネルギー低め'],
  evening:      ['すっきりしていた',    '普通',              '疲労感があった'],
  night:        ['落ち着いていた',      '普通',              'ざわざわしていた'],
};

const RATING_META: Array<{
  value: Rating;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  selectedColor: string;
  selectedBg: string;
  selectedBorder: string;
}> = [
  { value: 'A', Icon: TrendingUp,   selectedColor: 'var(--color-success)', selectedBg: 'var(--color-success-subtle)', selectedBorder: 'var(--color-success)' },
  { value: 'B', Icon: Minus,        selectedColor: 'var(--color-text-secondary)', selectedBg: 'var(--color-surface-subtle)', selectedBorder: 'var(--color-border-default)' },
  { value: 'C', Icon: TrendingDown, selectedColor: 'var(--color-warning)', selectedBg: 'var(--color-warning-subtle)', selectedBorder: 'var(--color-warning)' },
];

interface TimePeriodSelectorProps {
  timing: 'morning' | 'checkout';
  ratings: TimePeriodRatings;
  onChange: (ratings: TimePeriodRatings) => void;
}

export default function TimePeriodSelector({ timing, ratings, onChange }: TimePeriodSelectorProps) {
  const periods = timing === 'morning' ? MORNING_PERIODS : EVENING_PERIODS;

  const handleSelect = (periodKey: string, rating: Rating) => {
    onChange({ ...ratings, [periodKey]: rating });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {periods.map(({ key, label, Icon }) => {
        const selected = ratings[key] as Rating | undefined;
        const periodLabels = PERIOD_LABELS[key] ?? ['良い', '普通', '悪い'];
        return (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: 'var(--radius-lg)',
            background: selected ? 'var(--color-surface-subtle)' : 'transparent',
            border: `1px solid ${selected ? 'var(--color-border-strong)' : 'var(--color-border-default)'}`,
            transition: 'all 0.15s ease',
          }}>
            {/* 時間帯ラベル */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              minWidth: '44px', flexShrink: 0,
            }}>
              <Icon size={16} strokeWidth={1.8} color={selected ? 'var(--color-primary)' : 'var(--color-text-subtle)'} />
              <span style={{
                fontSize: '12px', fontWeight: 600,
                color: selected ? 'var(--color-primary)' : 'var(--color-text-subtle)',
                letterSpacing: '-0.01em',
              }}>
                {label}
              </span>
            </div>

            {/* 評価ボタン群 */}
            <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
              {RATING_META.map(({ value, Icon: RIcon, selectedColor, selectedBg, selectedBorder }, idx) => {
                const isSelected = selected === value;
                const btnLabel = periodLabels[idx];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSelect(key, value)}
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      padding: '8px 4px',
                      border: `1px solid ${isSelected ? selectedBorder : 'var(--color-border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? selectedBg : 'var(--card)',
                      color: isSelected ? selectedColor : 'var(--color-text-subtle)',
                      fontSize: '12px', fontWeight: isSelected ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 0 2px ${selectedBorder}` : 'none',
                      textAlign: 'center' as const,
                      lineHeight: 1.3,
                      wordBreak: 'break-all' as const,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <RIcon size={11} strokeWidth={2.2} color={isSelected ? selectedColor : 'var(--color-text-subtle)'} />
                    <span style={{ minWidth: 0 }}>{btnLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
