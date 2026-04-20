'use client';

import { useState, KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';

const MORNING_TAGS = [
  'ポルノ', '飲酒', 'kindle', 'YouTube', '友人とチャット', '早めに寝た',
];

const EVENING_TAGS = [
  'ジム', '瞑想', '友人と会った', 'お笑い動画', '散歩', 'バイク',
  '好きな音楽', '飲酒', '仕事', 'オフィス出社', '英語練習', '友人とチャット',
];

interface ActivityTagsProps {
  timing: 'morning' | 'checkout';
  selected: string[];
  onChange: (tags: string[]) => void;
  userTags: string[];
  onAddUserTag: (tag: string) => void;
}

function TagButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 14px', borderRadius: 'var(--radius-full)',
        border: selected
          ? '1.5px solid var(--color-warning)'
          : `1px solid ${hovered ? 'var(--color-border-strong)' : 'var(--color-border-default)'}`,
        background: selected ? 'var(--color-warning-subtle)' : hovered ? 'var(--color-surface-subtle)' : 'transparent',
        color: selected ? 'var(--color-warning)' : hovered ? 'var(--foreground)' : 'var(--color-text-secondary)',
        fontSize: '13px', fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        letterSpacing: '-0.01em',
        boxShadow: selected ? 'var(--shadow-sm)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

export default function ActivityTags({ timing, selected, onChange, userTags, onAddUserTag }: ActivityTagsProps) {
  const [inputValue, setInputValue] = useState('');

  const presetTags = timing === 'morning' ? MORNING_TAGS : EVENING_TAGS;

  const allTags = [...presetTags, ...userTags.filter(t => !presetTags.includes(t))];

  const toggle = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
  };

  const handleAddTag = () => {
    const tag = inputValue.trim();
    if (!tag || allTags.includes(tag)) { setInputValue(''); return; }
    onAddUserTag(tag);
    onChange([...selected, tag]);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '12px' }}>
        {allTags.map(label => (
          <TagButton key={label} label={label} selected={selected.includes(label)} onClick={() => toggle(label)} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="独自タグを追加..."
          style={{
            flex: 1, border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-full)', padding: '7px 14px',
            fontSize: '13px', color: 'var(--foreground)', background: 'var(--color-surface-subtle)',
            outline: 'none', transition: 'all 0.15s ease', minWidth: 0,
            letterSpacing: '-0.01em',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--color-primary)';
            e.target.style.background = 'var(--card)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--color-border-default)';
            e.target.style.background = 'var(--color-surface-subtle)';
          }}
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '7px 14px', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border-default)',
            background: inputValue.trim() ? 'var(--color-success-subtle)' : 'var(--color-surface-subtle)',
            color: inputValue.trim() ? 'var(--color-success)' : 'var(--color-text-subtle)',
            fontSize: '13px', fontWeight: 600, cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
            letterSpacing: '-0.01em',
          }}
        >
          <Plus size={13} strokeWidth={2.5} />
          追加
        </button>
      </div>
    </div>
  );
}
