'use client';

import { Sparkles } from 'lucide-react';

interface Section {
  label: string;
  text: string;
}

function parseComment(comment: string): Section[] | null {
  const markers = ['今日の状態', '気づき', '提案'];
  const result: Section[] = [];

  for (let i = 0; i < markers.length; i++) {
    const marker = `【${markers[i]}】`;
    const start = comment.indexOf(marker);
    if (start === -1) continue;
    const contentStart = start + marker.length;
    const nextMarker = markers[i + 1] ? `【${markers[i + 1]}】` : null;
    const nextPos = nextMarker ? comment.indexOf(nextMarker) : -1;
    const contentEnd = nextPos !== -1 ? nextPos : comment.length;
    const text = comment.slice(contentStart, contentEnd).trim();
    if (text) result.push({ label: markers[i], text });
  }

  return result.length >= 2 ? result : null;
}

interface CareCommentProps {
  comment: string;
  /** compact=true: ダッシュボード用（スペース節約）, false: 完了画面用 */
  compact?: boolean;
}

const SECTION_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  '今日の状態': { bg: 'var(--bg-subtle)', border: 'var(--border-muted)',  label: 'var(--text-muted)' },
  '気づき':     { bg: 'var(--bg-blue)',   border: 'var(--border-blue)',   label: '#2980B9' },
  '提案':       { bg: 'var(--bg-green)',  border: 'var(--border-green)',  label: 'var(--text-green-dark)' },
};

export default function CareComment({ comment, compact = false }: CareCommentProps) {
  const sections = parseComment(comment);

  if (!sections) {
    // 旧フォーマット（プレーンテキスト）はそのまま表示
    return (
      <div style={{
        background: 'var(--bg-green)', borderLeft: '3px solid #4DAF80',
        borderRadius: '0 10px 10px 0', padding: compact ? '10px 14px' : '14px 18px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', color: 'var(--text-green)', marginBottom: '6px', fontWeight: 600,
        }}>
          <Sparkles size={12} strokeWidth={2} />
          ひとこと
        </div>
        <p style={{ fontSize: compact ? '14px' : '15px', color: 'var(--text-green-dark)', lineHeight: 1.75, margin: 0 }}>
          {comment}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '12px', color: 'var(--text-green)', marginBottom: compact ? '10px' : '12px', fontWeight: 600,
      }}>
        <Sparkles size={12} strokeWidth={2} />
        ひとこと
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '10px' }}>
        {sections.map(({ label, text }) => {
          const colors = SECTION_COLORS[label] ?? SECTION_COLORS['今日の状態'];
          return (
            <div key={label} style={{
              background: colors.bg,
              border: `0.5px solid ${colors.border}`,
              borderRadius: '10px',
              padding: compact ? '10px 14px' : '14px 16px',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em',
                color: colors.label, marginBottom: '5px', textTransform: 'uppercase',
              }}>
                {label}
              </div>
              <p style={{
                fontSize: compact ? '13px' : '14px',
                color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0,
              }}>
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
