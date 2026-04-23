"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Loader2 } from "lucide-react";
import { isSundayHCM } from "@/lib/timing";
import { Button, Card } from "@takaki/go-design-system";

interface InsightPopupProps {
  weekStartStr: string;
  hasEnoughData: boolean;
}

export default function InsightPopup({
  weekStartStr,
  hasEnoughData,
}: InsightPopupProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSundayHCM() || !hasEnoughData) return;
    const key = `insight_dismissed_${weekStartStr}`;
    if (!localStorage.getItem(key)) setShow(true);
  }, [weekStartStr, hasEnoughData]);

  const handleLater = () => {
    localStorage.setItem(`insight_dismissed_${weekStartStr}`, "1");
    setShow(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      if (!res.ok) throw new Error("生成に失敗しました");
      localStorage.setItem(`insight_dismissed_${weekStartStr}`, "1");
      setShow(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(9,30,66,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
      }}
    >
      <Card className="relative max-w-[400px] w-full p-10">
        <Button
          onClick={handleLater}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground"
        >
          <X size={18} strokeWidth={2} />
        </Button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "var(--color-success-subtle)",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Sparkles
              size={26}
              strokeWidth={1.8}
              color="var(--color-success)"
            />
          </div>
          <h2
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--foreground)",
              marginBottom: "10px",
            }}
          >
            今週を振り返ります
          </h2>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              lineHeight: 1.75,
            }}
          >
            今週のコンディションデータをもとに、振り返りメッセージを生成します。
          </p>
        </div>

        {error && (
          <div
            style={{
              color: "var(--color-danger)",
              fontSize: "var(--text-sm)",
              marginBottom: "16px",
              background: "var(--color-danger-subtle)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                handleGenerate();
              }}
            >
              再試行
            </Button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 生成しています…
              </>
            ) : (
              <>
                <Sparkles size={16} strokeWidth={2} /> 振り返りを見る
              </>
            )}
          </Button>
          <Button
            onClick={handleLater}
            variant="outline"
            size="lg"
            className="w-full"
          >
            後で
          </Button>
        </div>
      </Card>
    </div>
  );
}
