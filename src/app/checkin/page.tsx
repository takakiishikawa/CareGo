import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CheckinForm from "@/components/checkin/CheckinForm";
import { getCheckinTiming, getTodayHCM } from "@/lib/timing";
import Link from "next/link";
import { CheckCircle, LayoutDashboard } from "lucide-react";
import { Button, Card, PageHeader } from "@takaki/go-design-system";

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayHCM();

  const { data: todayCheckins } = await supabase
    .from("checkins")
    .select("timing")
    .gte("checked_at", today + "T00:00:00Z")
    .lte("checked_at", today + "T23:59:59Z");

  const morningDone = (todayCheckins || []).some((c) => c.timing === "morning");
  const checkoutDone = (todayCheckins || []).some(
    (c) => c.timing === "checkout" || c.timing === "evening",
  );
  const timing = getCheckinTiming();
  const alreadyDone = timing === "morning" ? morningDone : checkoutDone;

  const isMorning = timing === "morning";
  const title = isMorning ? "朝チェックイン" : "夜チェックアウト";

  return (
    <div className="space-y-6">
      {/* PageHeader — 全ページ共通の位置で表示 */}
      <PageHeader
        title={title}
        description={
          isMorning
            ? "今朝の状態を記録しましょう"
            : "今日一日を締めくくりましょう"
        }
      />

      {alreadyDone ? (
        <div className="flex justify-center">
          <Card className="max-w-md w-full p-12 flex flex-col items-center text-center">
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "var(--color-success-subtle)",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <CheckCircle
                size={28}
                strokeWidth={2}
                color="var(--color-success)"
              />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {title}は完了済みです
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-7">
              {isMorning && !checkoutDone
                ? "夜チェックアウトは19時以降にできます。"
                : "今日のチェックイン・アウトは完了しています。"}
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard">
                <LayoutDashboard size={15} strokeWidth={2} />
                ダッシュボードへ
              </Link>
            </Button>
          </Card>
        </div>
      ) : (
        <CheckinForm timing={timing} />
      )}
    </div>
  );
}
