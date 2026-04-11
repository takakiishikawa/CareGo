'use client';

import { useState, KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';

const MORNING_TAGS = [
  'よく眠れた', '睡眠が浅い', 'ポルノ', '飲酒', 'kindle', 'YouTube', '早めに寝た',
];

const EVENING_TAGS = [
  'ジム', '瞑想', '友人と会った', 'お笑い動画', '散歩', 'バイク', '好きな音楽', '飲酒', '仕事', 'オフィス出社',
  'AIで遊ぶ', 'AIプロダクト開発', '英会話', '英語練習', 'ポッドキャストを聴いた', 'サウナ・マッサージ',
];

interface ActivityTagsProps {
  timing: 'morning' | 'evening';
  selected: string[];
  onChange: (tags: string[]) => void;
  userTags: string[];
  onAddUserTag: (tag: string) => void;
}

function TagButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        padding: '6px 16px', borderRadius: '9999px',
        border: selected
          ? '1.5px solid var(--accent-amber)'
          : `0.5px solid ${hovered ? 'var(--border-color-hover)' : 'var(--border-color)'}`,
        background: selected ? 'var(--bg-amber)' : hovered ? 'var(--bg-subtle)' : 'var(--bg-card)',
        color: selected ? 'var(--text-amber-dark)' : hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
        fontSize: '14px', fontWeight: selected ? 500 : 400,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
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
    if (!tag || allTags.includes(tag)) {
      setInputValue('');
      return;
    }
    onAddUserTag(tag);
    onChange([...selected, tag]);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {allTags.map(label => (
          <TagButton key={label} label={label} selected={selected.includes(label)} onClick={() => toggle(label)} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="独自タグを追加"
          style={{
            flex: 1, border: '0.5px solid var(--border-color)',
            borderRadius: '9999px', padding: '6px 14px',
            fontSize: '14px', color: 'var(--text-secondary)', background: 'var(--bg-card)',
            outline: 'none', transition: 'all 0.15s ease',
            minWidth: 0,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-amber)'; e.target.style.boxShadow = '0 0 0 3px rgba(192,120,24,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px', borderRadius: '9999px',
            border: '0.5px solid var(--border-color)',
            background: inputValue.trim() ? 'var(--bg-amber)' : 'var(--bg-muted)',
            color: inputValue.trim() ? 'var(--text-amber-dark)' : 'var(--text-placeholder)',
            fontSize: '13px', fontWeight: 500, cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <Plus size={13} strokeWidth={2.5} />
          追加
        </button>
      </div>
    </div>
  );
}
