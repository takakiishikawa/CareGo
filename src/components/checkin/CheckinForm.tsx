'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Activity, Mic, MicOff, BarChart2, FileText } from 'lucide-react';
import TimePeriodSelector from './TimePeriodSelector';
import ActivityTags from './ActivityTags';
import { createClient } from '@/lib/supabase/client';
import { TimePeriodRatings } from '@/lib/types';
import { Button, Card, Separator } from '@takaki/go-design-system';

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
    <div className="flex items-center gap-2 mb-3.5">
      <div className="flex size-[26px] shrink-0 items-center justify-center rounded-md border border-border bg-surface-subtle">
        {icon}
      </div>
      <span className="text-sm font-semibold text-foreground tracking-tight">{label}</span>
      {required && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>必須</span>}
      {optional && <span className="text-xs text-muted-foreground">任意</span>}
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
    <Card className="p-7 space-y-6">
      {/* 時間帯別コンディション */}
      <section>
        <SectionHeader
          icon={<BarChart2 size={13} strokeWidth={2.2} color="var(--color-primary)" />}
          label="時間帯別コンディション"
          required
        />
        <TimePeriodSelector timing={timing} ratings={ratings} onChange={setRatings} />
      </section>

      <Separator />

      {/* 活動タグ */}
      <section>
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

      <Separator />

      {/* メモ（音声入力）*/}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <SectionHeader
            icon={<FileText size={13} strokeWidth={2.2} color="var(--color-text-secondary)" />}
            label="メモ"
            optional
          />
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs font-semibold animate-pulse" style={{ color: 'var(--color-danger)' }}>
              <span className="size-[7px] rounded-full animate-pulse" style={{ background: 'var(--color-danger)', display: 'inline-block' }} />
              録音中
            </span>
          )}
        </div>

        <div
          className="rounded-lg p-4 flex flex-col gap-3 min-h-[80px] transition-all"
          style={{
            border: `1px solid ${isRecording ? 'var(--color-danger)' : 'var(--border)'}`,
            background: isRecording ? 'var(--color-danger-subtle)' : 'var(--color-surface-subtle)',
          }}
        >
          <p className="text-sm leading-relaxed flex-1 min-h-10"
            style={{ color: freeText ? 'var(--foreground)' : 'var(--color-text-subtle)', margin: 0 }}>
            {freeText || (isRecording ? '話してください…' : '音声入力ボタンを押して話してください')}
          </p>

          <div className="flex items-center gap-2.5">
            {speechSupported ? (
              <Button
                type="button"
                size="sm"
                variant={isRecording ? 'destructive' : 'default'}
                onClick={toggleRecording}
                className="rounded-full"
              >
                {isRecording
                  ? <><MicOff size={13} strokeWidth={2} /> 停止</>
                  : <><Mic size={13} strokeWidth={2} /> 音声入力</>
                }
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">このブラウザは音声入力非対応です</span>
            )}
            {freeText && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setFreeText('')}>
                クリア
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* エラー */}
      {error && (
        <div className="rounded-md border px-4 py-3 text-sm"
          style={{
            color: 'var(--color-danger)',
            background: 'var(--color-danger-subtle)',
            borderColor: 'var(--color-danger)',
          }}>
          {error}
        </div>
      )}

      {/* 送信ボタン */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        size="lg"
        className="w-full text-base font-bold"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} strokeWidth={2} className="animate-spin" />
            {timing === 'checkout' ? 'AIがスコアを算出中…' : 'Careがコメントを生成中…'}
          </>
        ) : (
          timing === 'morning' ? 'チェックインする →' : 'チェックアウトする →'
        )}
      </Button>

      {!isValid && (
        <p className="text-center text-xs text-muted-foreground">すべての時間帯を選択してください</p>
      )}
    </Card>
  );
}
