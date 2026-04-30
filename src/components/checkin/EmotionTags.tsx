"use client";

import { memo, useCallback, useMemo } from "react";

const EMOTION_TAGS = [
  "穏やか",
  "リラックス",
  "落ち着いている",
  "前向き",
  "やる気がある",
  "集中できている",
  "自信がある",
  "スッキリしている",
  "楽しい",
  "充実している",
  "ワクワク",
  "感謝",
  "達成感",
  "希望がある",
  "つながりを感じる",
  "疲れた",
  "だるい",
  "眠い",
  "体が重い",
  "不安",
  "モヤモヤ",
  "焦り",
  "プレッシャー",
  "イライラ",
  "落ち込んでいる",
  "悲しい",
  "空虚",
  "孤独",
];

const POSITIVE_TAGS = new Set([
  "穏やか",
  "リラックス",
  "落ち着いている",
  "前向き",
  "やる気がある",
  "集中できている",
  "自信がある",
  "スッキリしている",
  "楽しい",
  "充実している",
  "ワクワク",
  "感謝",
  "達成感",
  "希望がある",
  "つながりを感じる",
]);

interface EmotionTagsProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

const TagButton = memo(function TagButton({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: (label: string) => void;
}) {
  const isPositive = POSITIVE_TAGS.has(label);
  const handleClick = useCallback(() => onToggle(label), [label, onToggle]);

  const selectedBg = isPositive
    ? "var(--color-success-subtle)"
    : "var(--color-warning-subtle)";
  const selectedBorder = isPositive
    ? "var(--color-success)"
    : "var(--color-warning)";
  const selectedColor = isPositive
    ? "var(--color-success)"
    : "var(--color-warning)";

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        padding: "6px 14px",
        borderRadius: "var(--radius-full)",
        border: selected
          ? `1.5px solid ${selectedBorder}`
          : "1px solid var(--color-border-default)",
        background: selected ? selectedBg : "transparent",
        color: selected ? selectedColor : "var(--color-text-subtle)",
        fontSize: "13px",
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        transform: selected ? "scale(1.02)" : "scale(1)",
        transition: "all 0.15s ease",
        letterSpacing: "-0.01em",
        boxShadow: selected ? "var(--border border-border)" : "none",
      }}
    >
      {label}
    </button>
  );
});

export default function EmotionTags({ selected, onChange }: EmotionTagsProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = useCallback(
    (tag: string) => {
      onChange(
        selectedSet.has(tag)
          ? selected.filter((t) => t !== tag)
          : [...selected, tag],
      );
    },
    [selected, selectedSet, onChange],
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
      {EMOTION_TAGS.map((label) => (
        <TagButton
          key={label}
          label={label}
          selected={selectedSet.has(label)}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
