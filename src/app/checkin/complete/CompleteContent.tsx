"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Wind,
  CheckCircle,
  LayoutDashboard,
  Brain,
  Activity,
  Loader2,
} from "lucide-react";
import CareComment from "@/components/ui/CareComment";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from "@takaki/go-design-system";

interface CompleteContentProps {
  meditationUrl: string;
}

export default function CompleteContent({
  meditationUrl,
}: CompleteContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [meditationLogged, setMeditationLogged] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const checkinId = searchParams.get("id");
  const timing = searchParams.get("timing") || "morning";
  const comment = searchParams.get("comment") || "";
  const score = parseInt(searchParams.get("score") || "0");
  const mindScore = parseInt(searchParams.get("mind") || "0");
  const bodyScore = parseInt(searchParams.get("body") || "0");
  const isCheckout = timing === "checkout";
  const hasScore = isCheckout && score > 0;

  const handleMeditation = async () => {
    if (meditationLogged || isLogging) return;
    setIsLogging(true);
    try {
      await fetch("/api/meditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timing, checkin_id: checkinId }),
      });
      setMeditationLogged(true);
    } catch {
      /* ignore */
    } finally {
      setIsLogging(false);
      window.open(meditationUrl, "_blank", "noopener,noreferrer");
      router.push("/dashboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 完了ヘッダー ── */}
      <div className="flex items-center gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--color-success-subtle)" }}
        >
          <CheckCircle size={24} strokeWidth={2} color="var(--color-success)" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            記録しました
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCheckout ? "夜チェックアウト完了" : "朝チェックイン完了"}
          </p>
        </div>
      </div>

      {/* ── スコア（チェックアウト時のみ）── */}
      {hasScore && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "総合",
              value: score,
              color: "var(--color-success)",
              bg: "var(--color-success-subtle)",
              border: "var(--color-success)",
              Icon: null,
            },
            {
              label: "心",
              value: mindScore,
              color: "var(--color-warning)",
              bg: "var(--color-warning-subtle)",
              border: "var(--color-warning)",
              Icon: Brain,
            },
            {
              label: "体",
              value: bodyScore,
              color: "var(--color-success)",
              bg: "var(--color-success-subtle)",
              border: "var(--color-success)",
              Icon: Activity,
            },
          ].map(({ label, value, color, bg, border, Icon }) => (
            <div
              key={label}
              className="text-center rounded-lg py-4"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {Icon && <Icon size={11} strokeWidth={2} color={color} />}
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color }}
                >
                  {label}
                </p>
              </div>
              <p
                className="text-[28px] font-extrabold leading-none tabular-nums"
                style={{ color, letterSpacing: "-0.04em" }}
              >
                {value || "–"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Care コメント ── */}
      {comment && (
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Care からのコメント</CardDescription>
          </CardHeader>
          <CardContent>
            <CareComment comment={comment} />
          </CardContent>
        </Card>
      )}

      {/* ── 瞑想 CTA ── */}
      <Card
        className="p-5"
        style={
          {
            background: "var(--color-warning-subtle)",
            borderColor: "var(--color-warning)",
          } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex size-7 items-center justify-center rounded-md"
            style={{ background: "var(--card)", boxShadow: "var(--shadow-sm)" }}
          >
            <Wind size={14} strokeWidth={2} color="var(--color-warning)" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-warning)" }}
          >
            瞑想タイム
          </span>
        </div>
        <p className="text-sm text-foreground mb-3 leading-relaxed">
          記録できました。このまま瞑想に進みますか？
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleMeditation}
            disabled={isLogging || meditationLogged}
            size="sm"
            style={
              {
                background: "var(--color-warning)",
                border: "none",
              } as React.CSSProperties
            }
            className="text-white hover:opacity-90"
          >
            {isLogging ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Wind size={13} strokeWidth={2} />
            )}
            {meditationLogged ? "記録済み" : "瞑想に進む"}
          </Button>
          <p className="text-xs text-muted-foreground">
            別タブでYouTubeが開きます
          </p>
        </div>
      </Card>

      {/* ── ダッシュボードへ ── */}
      <Button variant="outline" asChild className="w-full">
        <Link href="/dashboard">
          <LayoutDashboard size={14} strokeWidth={2} />
          ダッシュボードへ戻る
        </Link>
      </Button>
    </div>
  );
}
