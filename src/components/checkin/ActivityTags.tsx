"use client";

import { useState, KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button, Input } from "@takaki/go-design-system";
import { TAG_MAX_LENGTH } from "@/lib/constants";

const MORNING_TAGS = [
  "ポルノ",
  "飲酒",
  "kindle",
  "YouTube",
  "友人とチャット",
  "早めに寝た",
];

const EVENING_TAGS = [
  "ジム",
  "瞑想",
  "友人と会った",
  "お笑い動画",
  "散歩",
  "バイク",
  "好きな音楽",
  "飲酒",
  "仕事",
  "オフィス出社",
  "英語練習",
  "友人とチャット",
];

interface ActivityTagsProps {
  timing: "morning" | "checkout";
  selected: string[];
  onChange: (tags: string[]) => void;
  userTags: string[];
  onAddUserTag: (tag: string) => void;
}

function TagButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      className="transition-all duration-150 whitespace-nowrap text-[13px] tracking-tight"
      style={{
        padding: "6px 14px",
        borderRadius: "var(--radius-full)",
        border: selected
          ? "1.5px solid var(--color-warning)"
          : "1px solid var(--border)",
        background: selected ? "var(--color-warning-subtle)" : "transparent",
        color: selected ? "var(--color-warning)" : "var(--muted-foreground)",
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        transform: selected ? "scale(1.02)" : "scale(1)",
        boxShadow: selected ? "var(--shadow-sm)" : "none",
      }}
    >
      {label}
    </Button>
  );
}

export default function ActivityTags({
  timing,
  selected,
  onChange,
  userTags,
  onAddUserTag,
}: ActivityTagsProps) {
  const [inputValue, setInputValue] = useState("");

  const presetTags = timing === "morning" ? MORNING_TAGS : EVENING_TAGS;
  const allTags = [
    ...presetTags,
    ...userTags.filter((t) => !presetTags.includes(t)),
  ];

  const toggle = (tag: string) => {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag],
    );
  };

  const handleAddTag = () => {
    const tag = inputValue.trim().slice(0, TAG_MAX_LENGTH);
    if (!tag || allTags.includes(tag)) {
      setInputValue("");
      return;
    }
    onAddUserTag(tag);
    onChange([...selected, tag]);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-[7px] mb-3">
        {allTags.map((label) => (
          <TagButton
            key={label}
            label={label}
            selected={selected.includes(label)}
            onClick={() => toggle(label)}
          />
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="独自タグを追加..."
          className="flex-1 rounded-full text-[13px] tracking-tight min-w-0"
          maxLength={TAG_MAX_LENGTH}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
          className="rounded-full shrink-0"
        >
          <Plus size={13} strokeWidth={2.5} />
          追加
        </Button>
      </div>
    </div>
  );
}