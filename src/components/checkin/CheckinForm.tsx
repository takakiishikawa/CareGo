'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Activity, Mic, MicOff, BarChart2, FileText } from 'lucide-react';
import TimePeriodSelector from './TimePeriodSelector';
import ActivityTags from './ActivityTags';
import { createClient } from '@/lib/supabase/client';
import { TimePeriodRatings } from '@/lib/types';

interface CheckinFormProps {
  timing: 'morning' | 'checkout';
}

function SectionHeader({ icon, label, required = false, optional = false }: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface-subtle)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
        {label}
      </span>
      {required && <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>必須</span>}
      {optional && <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>任意</span>}
    </div>
  );
}

export default function CheckinForm({ timing }: CheckinFormProps) {
  const router = useRouter();
  const isMorning = timing === 'morning';

  const [ratings, setRatings] = useState<TimePeriodRatings>({});
  const [activityTags, setActivityTags] = useState<string[]>([]);
  const [userActivityTags, setUserActivityTags] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 音声入力
  interface SREvent { resultIndex: number; results: SpeechRecognitionResultList }
  type SR = {
    lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
    onresult: ((e: SREvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void; stop: () => void;
  };
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SR | null>(null);
  const baseTextRef = useRef('');

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) { stopRecording(); return; }
    const w = window as unknown as Record<string, new () => SR>;
    const SRClass = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SRClass) return;
    baseTextRef.current = freeText;
    const rec = new SRClass();
    rec.lang = 'ja-JP'; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
    rec.onresult = (e: SREvent) => {
      let interim = ''; let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (final) baseTextRef.current = (baseTextRef.current + final).trimStart();
      setFreeText((baseTextRef.current + interim).trimStart());
    };
    rec.onerror = () => stopRecording();
    rec.onend = () => { setFreeText(baseTextRef.current); setIsRecording(false); recognitionRef.current = null; };
    recognitionRef.current = rec; rec.start(); setIsRecording(true);
  }, [isRecording, freeText, stopRecording]);

  const expectedPeriods = isMorning
    ? ['last_night', 'this_morning']
    : ['morning', 'afternoon', 'evening', 'night'];
  const isValid = expectedPeriods.every(p => ratings[p] !== undefined);

  const activityLabel = isMorning ? '昨夜の活動' : '今日の活動';

  useEffect(() => {
    const supabase = createClient();
    supabase.from('user_tags').select('tag_name')
      .eq('tag_type', isMorning ? 'morning_activity' : 'evening_activity')
      .then(({ data }) => { if (data) setUserActivityTags(data.map(r => r.tag_name)); });
  }, [isMorning]);

  const handleAddUserTag = async (tag: string) => {
    setUserActivityTags(prev => [...prev, tag]);
    const supabase = createClient();
    await supabase.from('user_tags').insert({
      tag_name: tag,
      tag_type: isMorning ? 'morning_activity' : 'evening_activity',
    });
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timing, time_period_ratings: ratings, activity_tags: activityTags, free_text: freeText || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '送信に失敗しました'); return; }
      const params = new URLSearchParams({
        id: data.checkin.id, timing,
        comment: data.checkin.ai_comment || '',
        score: String(data.checkin.condition_score || 0),
        mind: String(data.checkin.mind_score || 0),
        body: String(data.checkin.body_score || 0),
      });
      router.push(`/checkin/complete?${params.toString()}`);
    } catch {
      setError('送信中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* ページヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-lg)',
            background: isMorning
              ? 'var(--color-primary)'
              : 'var(--color-text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '20px' }}>{isMorning ? '☀' : '☾'}</span>
          </div>
          <div>
            <h1 style={{
              fontSize: '20px', fontWeight: 700, color: 'var(--foreground)',
              margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>
              {isMorning ? '朝チェックイン' : '夜チェックアウト'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', margin: 0 }}>
              {isMorning ? '今朝の状態を記録しましょう' : '今日一日を締めくくりましょう'}
            </p>
          </div>
        </div>
      </div>

      {/* フォームカード */}
      <div className="checkin-card" style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 28px',
        boxShadow: 'var(--shadow-md)',
      }}>

        {/* 時間帯別コンディション */}
        <section style={{ marginBottom: '24px' }}>
          <SectionHeader
            icon={<BarChart2 size={13} strokeWidth={2.2} color="var(--color-primary)" />}
            label="時間帯別コンディション"
            required
          />
          <TimePeriodSelector timing={timing} ratings={ratings} onChange={setRatings} />
        </section>

        <div style={{ borderTop: '1px solid var(--border)', margin: '0 -2px 24px' }} />

        {/* 活動タグ */}
        <section style={{ marginBottom: '24px' }}>
          <SectionHeader
            icon={<Activity size={13} strokeWidth={2.2} color="var(--color-warning)" />}
            label={activityLabel}
            optional
          />
          <ActivityTags
            timing={timing}
            selected={activityTags}
            onChange={setActivityTags}
            userTags={userActivityTags}
            onAddUserTag={handleAddUserTag}
          />
        </section>

        <div style={{ borderTop: '1px solid var(--border)', margin: '0 -2px 24px' }} />

        {/* メモ（音声入力）*/}
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <SectionHeader
              icon={<FileText size={13} strokeWidth={2.2} color="var(--color-text-secondary)" />}
              label="メモ"
              optional
            />
            {isRecording && (
              <span style={{
                fontSize: '12px', color: 'var(--color-danger)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '5px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--color-danger)', display: 'inline-block',
                  animation: 'pulse 1s ease-in-out infinite',
                }} />
                録音中
              </span>
            )}
          </div>

          {/* 音声入力エリア */}
          <div style={{
            border: `1px solid ${isRecording ? 'var(--color-danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            background: isRecording ? 'var(--color-danger-subtle)' : 'var(--color-surface-subtle)',
            transition: 'all 0.15s ease',
            minHeight: '80px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {/* テキスト表示 */}
            <p style={{
              fontSize: '14px',
              color: freeText ? 'var(--foreground)' : 'var(--color-text-subtle)',
              lineHeight: 1.7, margin: 0, flex: 1,
              minHeight: '40px',
            }}>
              {freeText || (isRecording ? '話してください…' : '音声入力ボタンを押して話してください')}
            </p>

            {/* ボタン行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {speechSupported ? (
                <button
                  type="button"
                  onClick={toggleRecording}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 16px', borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: isRecording
                      ? 'var(--color-danger)'
                      : 'var(--color-primary)',
                    color: 'white',
                    fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {isRecording
                    ? <><MicOff size={14} strokeWidth={2} /> 停止</>
                    : <><Mic size={14} strokeWidth={2} /> 音声入力</>
                  }
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>
                  このブラウザは音声入力非対応です
                </span>
              )}

              {freeText && (
                <button
                  type="button"
                  onClick={() => setFreeText('')}
                  style={{
                    fontSize: '12px', color: 'var(--color-text-subtle)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 8px', borderRadius: 'var(--radius-md)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        </section>

        {/* エラー */}
        {error && (
          <div style={{
            fontSize: '14px', color: 'var(--color-danger)',
            background: 'var(--color-danger-subtle)', padding: '12px 16px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: isValid && !isSubmitting ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
            color: isValid ? 'white' : 'var(--color-text-subtle)',
            border: 'none', borderRadius: 'var(--radius-lg)',
            padding: '15px 24px', fontSize: '16px', fontWeight: 700,
            cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            letterSpacing: '-0.02em',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
              {timing === 'checkout' ? 'AIがスコアを算出中…' : 'Careがコメントを生成中…'}
            </>
          ) : (
            timing === 'morning' ? 'チェックインする →' : 'チェックアウトする →'
          )}
        </button>

        {!isValid && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-subtle)', marginTop: '10px' }}>
            すべての時間帯を選択してください
          </p>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
