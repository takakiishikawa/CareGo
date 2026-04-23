import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import webpush from "web-push";
import { ANTHROPIC_MODEL } from "@/lib/constants";
import { getHCMHour } from "@/lib/timing";
import { countTags } from "@/lib/tag-utils";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateNotificationMessage(
  recentCheckins: Array<{
    condition_score: number | null;
    activity_tags: string[];
  }>,
): Promise<string> {
  const avgScore =
    recentCheckins.length > 0
      ? Math.round(
          recentCheckins
            .filter((c) => c.condition_score !== null)
            .reduce((s, c) => s + (c.condition_score || 0), 0) /
            recentCheckins.length,
        )
      : null;

  const activityCounts = countTags(recentCheckins.map((c) => c.activity_tags));
  const topActivity = Object.entries(activityCounts).sort(
    ([, a], [, b]) => b - a,
  )[0]?.[0];

  const context =
    avgScore !== null
      ? `直近のコンディションスコア平均: ${avgScore}。${topActivity ? `よく記録されている活動: ${topActivity}。` : ""}`
      : "今日のコンディションはまだ記録されていません。";

  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 80,
    messages: [{ role: "user", content: context }],
    system: `夜のチェックインを促すプッシュ通知の本文を1文で生成してください。
ユーザーのコンディション情報を踏まえて、具体的で温かみのある文にしてください。
30文字以内の日本語テキストのみ返してください。`,
  });

  const content = message.content[0];
  if (content.type === "text") return content.text.trim().slice(0, 60);
  return "今日の振り返りをしましょう";
}

export async function GET(request: Request) {
  // Vercel Cron からの呼び出しを検証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // VAPIDキーを設定（ランタイムで行う）
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@carego.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    process.env.VAPID_PRIVATE_KEY || "",
  );

  const nowHCM = getHCMHour();

  const supabase = createAdminClient();

  // 現在時刻が通知時間のユーザーを取得
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .eq("notification_time", nowHCM);

  if (error || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let sentCount = 0;

  for (const sub of subscriptions) {
    try {
      // ユーザーの最近のチェックイン取得
      const { data: recentCheckins } = await supabase
        .from("checkins")
        .select("condition_score, activity_tags")
        .eq("user_id", sub.user_id)
        .gte("checked_at", sevenDaysAgo.toISOString())
        .order("checked_at", { ascending: false })
        .limit(10);

      const body = await generateNotificationMessage(recentCheckins || []);

      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({ title: "CareGo", body }),
      );

      sentCount++;
    } catch {
      // 失敗した場合、期限切れのサブスクリプションを削除
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
    }
  }

  return NextResponse.json({ sent: sentCount });
}
