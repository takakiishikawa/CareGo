import {
  TrendingUp,
  Lightbulb,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

export interface InsightSections {
  summary: string;
  insight: string;
  suggestion: string;
}

export interface SectionMeta {
  key: keyof InsightSections;
  label: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export function parseInsightSections(text: string): InsightSections | null {
  const summaryMatch =
    text.match(
      /【今週のサマリー】\s*([\s\S]*?)(?=【パターン分析】|【来週への一言】|$)/,
    ) ??
    text.match(
      /【今週のまとめ】\s*([\s\S]*?)(?=【気づき】|【来週への提案】|$)/,
    );
  const insightMatch =
    text.match(/【パターン分析】\s*([\s\S]*?)(?=【来週への一言】|$)/) ??
    text.match(/【気づき】\s*([\s\S]*?)(?=【来週への提案】|$)/);
  const suggestionMatch =
    text.match(/【来週への一言】\s*([\s\S]*?)$/) ??
    text.match(/【来週への提案】\s*([\s\S]*?)$/);

  if (!summaryMatch && !insightMatch && !suggestionMatch) return null;

  return {
    summary: summaryMatch?.[1]?.trim() ?? "",
    insight: insightMatch?.[1]?.trim() ?? "",
    suggestion: suggestionMatch?.[1]?.trim() ?? "",
  };
}

export const SECTION_META: SectionMeta[] = [
  {
    key: "summary",
    label: "今週のサマリー",
    Icon: TrendingUp,
    color: "var(--color-success)",
    bg: "var(--color-success-subtle)",
    border: "var(--color-success)",
  },
  {
    key: "insight",
    label: "パターン分析",
    Icon: Lightbulb,
    color: "var(--color-warning)",
    bg: "var(--color-warning-subtle)",
    border: "var(--color-warning)",
  },
  {
    key: "suggestion",
    label: "来週への一言",
    Icon: ArrowRight,
    color: "var(--color-success)",
    bg: "var(--color-success-subtle)",
    border: "var(--color-success)",
  },
];
