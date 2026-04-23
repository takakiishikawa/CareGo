"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Activity,
  Mic,
  MicOff,
  BarChart2,
  FileText,
} from "lucide-react";
import TimePeriodSelector from "./TimePeriodSelector";
import ActivityTags from "./ActivityTags";
import { createClient } from "@/lib/supabase/client";
import { TimePeriodRatings } from "@/lib/types";
import { Button, Card, Separator } from "@takaki/go-design-system";

interface CheckinFormProps {
  timing: "morning" | "checkout";
}

function SectionLabel({
  icon,
  label,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: "required" | "optional";
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="flex size-6 shrink-0 items-center justify-center rounded border border-border"
        style={{ background: "var(--color-surface-subtle)" }}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        {label}
      </span>
      {badge === "required" && (
        <span className="text-xs" style={{ color: "var(--color-danger)" }}>
          必須
        </span>
      )}
      {badge === "optional" && (
        <span className="text-xs text-muted-foreground">任意</span>
      )}
    </div>
  );
}

export default function CheckinForm({ timing }: CheckinFormProps) {
  const router = useRouter();
  const isMorning = timing === "morning";

  const [ratings, setRatings] = useState<TimePeriodRatings>({});
  const [activityTags, setActivityTags] = useState<string[]>([]);
  const [userActivityTags, setUserActivityTags] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  interface SREvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
  type SR = {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    onresult: ((e: SREvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  };
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SR | null>(null);
  const baseTextRef = useRef("");

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
    if (isRecording) {
      stopRecording();
      return;
    }
    const w = window as unknown as Record<string, new () => SR>;
    const SRClass = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SRClass) return;
    baseTextRef.current = freeText;
    const rec = new SRClass();
    rec.lang = "ja-JP";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e: SREvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final)
        baseTextRef.current = (baseTextRef.current + final).trimStart();
      setFreeText((baseTextRef.current + interim).trimStart());
    };
    rec.onerror = () => stopRecording();
    rec.onend = () => {
      setFreeText(baseTextRef.current);
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [isRecording, freeText, stopRecording]);

  const expectedPeriods = isMorning
    ? ["last_night", "this_morning"]
    : ["morning", "afternoon", "evening", "night"];
  const isValid = expectedPeriods.every((p) => ratings[p] !== undefined);
  const filledCount = expectedPeriods.filter(
    (p) => ratings[p] !== undefined,
  ).length;

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("user_tags")
      .select("tag_name")
      .eq("tag_type", isMorning ? "morning_activity" : "evening_activity")
      .then(({ data }) => {
        if (data) setUserActivityTags(data.map((r) => r.tag_name));
      });
  }, [isMorning]);

  const handleAddUserTag = async (tag: string) => {
    setUserActivityTags((prev) => [...prev, tag]);
    const supabase = createClient();
    await supabase.from("user_tags").insert({
      tag_name: tag,
      tag_type: isMorning ? "morning_activity" : "evening_activity",
    });
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timing,
          time_period_ratings: ratings,
          activity_tags: activityTags,
          free_text: freeText || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送信に失敗しました");
        return;
      }
      const params = new URLSearchParams({
        id: data.checkin.id,
        timing,
        comment: data.checkin.ai_comment || "",
        score: String(data.checkin.condition_score || 0),
        mind: String(data.checkin.mind_score || 0),
        body: String(data.checkin.body_score || 0),
      });
      router.push(`/checkin/complete?${params.toString()}`);
    } catch {
      setError("送信中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Card className="overflow-hidden p-0">
        {/* 2-col layout on lg: left = time periods, right = activity + memo */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* ── 左パネル：時間帯コンディション ── */}
          <div className="p-6 lg:border-r border-b lg:border-b-0 border-border">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel
                icon={
                  <BarChart2
                    size={13}
                    strokeWidth={2.2}
                    color="var(--color-primary)"
                  />
                }
                label="時間帯別コンディション"
                badge="required"
              />
              <span className="text-xs text-muted-foreground tabular-nums">
                {filledCount} / {expectedPeriods.length}
              </span>
            </div>
            <TimePeriodSelector
              timing={timing}
              ratings={ratings}
              onChange={setRatings}
            />
          </div>

          {/* ── 右パネル：活動 + メモ ── */}
          <div className="p-6 space-y-5">
            {/* 活動タグ */}
            <div>
              <SectionLabel
                icon={
                  <Activity
                    size={13}
                    strokeWidth={2.2}
                    color="var(--color-warning)"
                  />
                }
                label={isMorning ? "昨夜の活動" : "今日の活動"}
                badge="optional"
              />
              <ActivityTags
                timing={timing}
                selected={activityTags}
                onChange={setActivityTags}
                userTags={userActivityTags}
                onAddUserTag={handleAddUserTag}
              />
            </div>

            <Separator />

            {/* メモ */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel
                  icon={
                    <FileText
                      size={13}
                      strokeWidth={2.2}
                      color="var(--muted-foreground)"
                    />
                  }
                  label="メモ"
                  badge="optional"
                />
                {isRecording && (
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold animate-pulse"
                    style={{ color: "var(--color-danger)" }}
                  >
                    <span
                      className="size-[6px] rounded-full inline-block animate-pulse"
                      style={{ background: "var(--color-danger)" }}
                    />
                    録音中
                  </span>
                )}
              </div>

              <div
                className="rounded-lg p-3.5 transition-all min-h-[72px] flex flex-col gap-3"
                style={{
                  border: `1px solid ${isRecording ? "var(--color-danger)" : "var(--border)"}`,
                  background: isRecording
                    ? "var(--color-danger-subtle)"
                    : "var(--color-surface-subtle)",
                }}
              >
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{
                    color: freeText
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                    margin: 0,
                  }}
                >
                  {freeText ||
                    (isRecording
                      ? "話してください…"
                      : "音声入力ボタンを押して話してください")}
                </p>

                <div className="flex items-center gap-2">
                  {speechSupported ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={toggleRecording}
                      className="rounded-full"
                    >
                      {isRecording ? (
                        <>
                          <MicOff size={12} strokeWidth={2} /> 停止
                        </>
                      ) : (
                        <>
                          <Mic size={12} strokeWidth={2} /> 音声入力
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      このブラウザは音声入力非対応です
                    </span>
                  )}
                  {freeText && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFreeText("")}
                    >
                      クリア
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── フッター：エラー + 送信 ── */}
        <div className="p-6 border-t border-border space-y-3">
          {error && (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{
                color: "var(--color-danger)",
                background: "var(--color-danger-subtle)",
                borderColor: "var(--color-danger)",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              size="lg"
              className="flex-1 text-base font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                  {timing === "checkout"
                    ? "AIがスコアを算出中…"
                    : "Careがコメントを生成中…"}
                </>
              ) : timing === "morning" ? (
                "チェックインする →"
              ) : (
                "チェックアウトする →"
              )}
            </Button>

            {!isValid && (
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                あと {expectedPeriods.length - filledCount} 項目
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
