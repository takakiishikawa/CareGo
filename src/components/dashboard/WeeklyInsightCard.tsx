import { BrainCircuit } from 'lucide-react';
import { WeeklyInsight } from '@/lib/types';

interface InsightSections {
  summary: string;
  insight: string;
  suggestion: string;
}

function parseInsightSections(text: string): InsightSections | null {
  const summaryMatch = text.match(/【今週のまとめ】\s*([\s\S]*?)(?=【気づき】|$)/);
  const insightMatch = text.match(/【気づき】\s*([\s\S]*?)(?=【来週への提案】|$)/);
  const suggestionMatch = text.match(/【来週への提案】\s*([\s\S]*?)$/);

  if (!summaryMatch && !insightMatch && !suggestionMatch) return null;

  return {
    summary: summaryMatch?.[1]?.trim() ?? '',
    insight: insightMatch?.[1]?.trim() ?? '',
    suggestion: suggestionMatch?.[1]?.trim() ?? '',
  };
}

interface WeeklyInsightCardProps {
  insight: WeeklyInsight | null;
  thisWeekAvg: number | null;
  lastWeekAvg: number | null;
}

export default function WeeklyInsightCard({ insight, thisWeekAvg, lastWeekAvg }: WeeklyInsightCardProps) {
  const weekDiff = thisWeekAvg !== null && lastWeekAvg !== null
    ? Math.round(thisWeekAvg - lastWeekAvg)
    : null;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border-color)',
      borderRadius: '14px', padding: '24px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-placeholder)', fontWeight: 500 }}>
          <BrainCircuit size={16} strokeWidth={1.8} color="var(--text-placeholder)" />
          週次レポート
        </div>

        {/* 週平均比較バッジ */}
        {thisWeekAvg !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-placeholder)' }}>
              今週平均 <span style={{ color: 'var(--text-green)', fontWeight: 600 }}>{Math.round(thisWeekAvg)}</span>
            </span>
            {lastWeekAvg !== null && (
              <>
                <span style={{ fontSize: '14px', color: 'var(--text-placeholder)' }}>
                  先週 <span style={{ fontWeight: 500 }}>{Math.round(lastWeekAvg)}</span>
                </span>
                {weekDiff !== null && weekDiff !== 0 && (
                  <span style={{
                    fontSize: '14px', fontWeight: 600,
                    color: weekDiff > 0 ? 'var(--accent-green)' : 'var(--accent-amber)',
                    background: weekDiff > 0 ? 'var(--bg-green)' : 'var(--bg-amber)',
                    border: `0.5px solid ${weekDiff > 0 ? 'var(--border-green)' : 'var(--border-amber)'}`,
                    padding: '2px 8px', borderRadius: '9999px',
                  }}>
                    {weekDiff > 0 ? `+${weekDiff}` : weekDiff}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {insight ? (() => {
        const sections = parseInsightSections(insight.insight_text);
        return (
          <div>
            {weekDiff !== null && (
              <p style={{ fontSize: '14px', color: weekDiff > 0 ? 'var(--text-green)' : 'var(--text-amber)', marginBottom: '14px', fontWeight: 500 }}>
                {weekDiff > 0
                  ? `先週より平均+${weekDiff}ポイント、調子が上向いています`
                  : weekDiff < 0
                    ? `先週より平均${weekDiff}ポイント、無理しすぎていないか振り返ってみましょう`
                    : '先週と同じペースで維持できています'}
              </p>
            )}
            {sections ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: '今週のまとめ', text: sections.summary },
                  { label: '気づき', text: sections.insight },
                  { label: '来週への提案', text: sections.suggestion },
                ].map(({ label, text }, i) => text && (
                  <div key={label}>
                    {i > 0 && <div style={{ borderTop: '0.5px solid var(--border-color)', margin: '12px 0' }} />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-placeholder)', letterSpacing: '0.03em' }}>
                        【{label}】
                      </span>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                {insight.insight_text}
              </p>
            )}
          </div>
        );
      })() : (
        <p style={{ fontSize: '14px', color: 'var(--text-placeholder)', margin: 0, lineHeight: 1.7 }}>
          日曜日にログインすると、今週の振り返りが生成されます。
        </p>
      )}
    </div>
  );
}
