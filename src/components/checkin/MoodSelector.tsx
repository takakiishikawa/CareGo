'use client';

import { useState } from 'react';
import MoodFace from './MoodFaces';

const MOOD_LABELS: Record<number, string> = {
  1: '最悪', 2: '低め', 3: '普通', 4: '良い', 5: '最高',
};

interface MoodSelectorProps {
  value: number | null;
  onChange: (score: number) => void;
}

function MoodButton({ score, selected, onClick }: { score: number; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        flex: 1, padding: '14px 6px 12px', borderRadius: 'var(--radius-lg)',
        border: selected
          ? '2px solid var(--color-primary)'
          : `0.5px solid ${hovered ? 'var(--color-border-strong)' : 'var(--color-border-default)'}`,
        background: selected ? 'var(--color-surface-subtle)' : hovered ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
        cursor: 'pointer', textAlign: 'center',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'all 0.15s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      }}
    >
      <MoodFace score={score as 1|2|3|4|5} selected={selected} size={34} />
      <div style={{ fontSize: '12px', fontWeight: 500, color: selected ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}>
        {MOOD_LABELS[score]}
      </div>
    </button>
  );
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[1, 2, 3, 4, 5].map(score => (
        <MoodButton key={score} score={score} selected={value === score} onClick={() => onChange(score)} />
      ))}
    </div>
  );
}
