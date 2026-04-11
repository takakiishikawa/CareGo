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

// 時間帯ごとの [A評価ラベル, B評価ラベル, C評価ラベル]
const PERIOD_LABELS: Record<string, [string, string, string]> = {
  last_night:   ['ぐっすり眠れた',     'まあまあだった', 'あまり眠れなかった'],
  this_morning: ['すっきり起きられた', '普通',          'だるかった'],
  morning:      ['集中できた',         '普通',          '集中できなかった'],
  afternoon:    ['エネルギーがあった', '普通',          'エネルギーが落ちていた'],
  evening:      ['すっきりしていた',   '普通',          '疲労感があった'],
  night:        ['落ち着いていた',     '普通',          'ざわざわしていた'],
};

const RATING_META: Array<{
  value: Rating;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  selectedColor: string;
  selectedBg: string;
  selectedBorder: string;
}> = [
  { value: 'A', Icon: TrendingUp,   selectedColor: 'var(--text-green)', selectedBg: 'var(--bg-green)', selectedBorder: 'var(--border-green)' },
  { value: 'B', Icon: Minus,        selectedColor: 'var(--text-muted)',  selectedBg: 'var(--bg-muted)', selectedBorder: 'var(--border-muted)' },
  { value: 'C', Icon: TrendingDown, selectedColor: 'var(--text-amber)',  selectedBg: 'var(--bg-amber)', selectedBorder: 'var(--border-amber)' },
];

interface TimePeriodSelectorProps {
  timing: CheckinTiming;
  ratings: TimePeriodRatings;
  onChange: (ratings: TimePeriodRatings) => void;
}

export default function TimePeriodSelector({ timing, ratings, onChange }: TimePeriodSelectorProps) {
  const periods = timing === 'morning' ? MORNING_PERIODS : EVENING_PERIODS;

  const handleSelect = (periodKey: string, rating: Rating) => {
    onChange({ ...ratings, [periodKey]: rating });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {periods.map(({ key, label, Icon }) => {
        const selected = ratings[key] as Rating | undefined;
        const periodLabels = PERIOD_LABELS[key] ?? ['良い', '普通', '悪い'];
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 時間帯ラベル */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              minWidth: '52px', flexShrink: 0,
            }}>
              <Icon size={15} strokeWidth={1.8} color="var(--text-placeholder)" />
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {label}
              </span>
            </div>

            {/* 評価ボタン */}
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
                      padding: '9px 6px',
                      border: `0.5px solid ${isSelected ? selectedBorder : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      background: isSelected ? selectedBg : 'var(--bg-subtle)',
                      color: isSelected ? selectedColor : 'var(--text-placeholder)',
                      fontSize: '13px', fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 0 1.5px ${selectedBorder}` : 'none',
                      textAlign: 'center' as const,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <RIcon size={12} strokeWidth={2} color={isSelected ? selectedColor : 'var(--text-placeholder)'} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{btnLabel}</span>
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
