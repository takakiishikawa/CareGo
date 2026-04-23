import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Rating, TimePeriodRatings } from "@/lib/types";
import { ANTHROPIC_MODEL } from "@/lib/constants";
import { countTags, topTagsText } from "@/lib/tag-utils";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PERIOD_LABELS: Record<string, string> = {
  last_night: "昨夜",
  this_morning: "今朝",
  morning: "午前",
  afternoon: "午後",
  evening: "夕方",
  night: "夜",
};

const RATING_LABEL: Record<Rating, string> = {
  A: "良い",
  B: "普通",
  C: "悪い",
};

/** Careのシステムプロンプト（固定コンテキスト含む） */
const CARE_SYSTEM_PROMPT = `あなたはCare（ケア）です。ユーザーのコンディション管理をサポートするAIです。

【ユーザーの固定コンテキスト】
- ホーチミン在住・一人暮らし・日本人唯一のオフィス環境
- 朝夜の瞑想習慣・ジム通い・英語学習中
- 夕方にコンディションが不安定になりやすい傾向がある
- 友人との交流・つながりが回復行動として特に有効

【禁止事項】
- 入力内容をそのまま言い換えるだけのコメント
- 「早寝しましょう」等の一般的アドバイス
- 過度な褒め・励まし

【必須事項】
- 活動タグとスコアの因果に必ず言及する
- 「〇〇をした日はスコアが〜点低い傾向がある」等の具体的相関
- 提案は今日・この時間帯に実行可能な1つに絞る
- 親身に・短く・核心を突く

【出力形式】必ず以下の3セクションのみ出力してください：

【ひとこと】
核心メッセージを1〜2文で。

【気づき】
活動タグとスコアの具体的相関を2文以内で。

【提案】
今すぐできる具体的なアクションを1文で。

絵文字禁止。テキストのみ返してください。`;

/** チェックアウト時にAIが3スコアを算出するプロンプト */
const SCORE_SYSTEM_PROMPT = `あなたはコンディション評価AIです。
ユーザーの1日のデータを分析して、以下の3つのスコアを算出してください。

- condition_score: 総合コンディション（0-100）
- mind_score: 心のコンディション（0-100）
- body_score: 体のコンディション（0-100）

【評価基準】
A評価=良い(+)、B評価=普通(0)、C評価=悪い(-)として総合判断。
活動タグも参考にしてください（瞑想・ジム・友人との交流はポジティブ、飲酒・ポルノはネガティブ）。

必ずJSONのみを返してください。説明文は不要。
形式: {"condition_score": 75, "mind_score": 70, "body_score": 80}`;

function ratingsToText(ratings: TimePeriodRatings): string {
  return Object.entries(ratings)
    .map(
      ([key, val]) =>
        `${PERIOD_LABELS[key] ?? key}: ${RATING_LABEL[val]}(${val})`,
    )
    .join("、");
}

function formatHCMTime(isoStr: string): string {
  const d = new Date(isoStr);
  const h = (d.getUTCHours() + 7) % 24;
  const m = d.getUTCMinutes();
  return `${h}:${String(m).padStart(2, "0")}`;
}

async function calculateScoresWithAI(
  morningRatings: TimePeriodRatings | null,
  morningTags: string[],
  morningText: string | null,
  checkoutRatings: TimePeriodRatings,
  checkoutTags: string[],
  checkoutText: string | null,
  recentScores: string,
): Promise<{
  condition_score: number;
  mind_score: number;
  body_score: number;
}> {
  const dataStr = [
    morningRatings ? `朝チェックイン: ${ratingsToText(morningRatings)}` : null,
    morningTags.length ? `朝の活動: ${morningTags.join("、")}` : null,
    morningText ? `朝のメモ: ${morningText}` : null,
    `夜チェックアウト: ${ratingsToText(checkoutRatings)}`,
    checkoutTags.length ? `今日の活動: ${checkoutTags.join("、")}` : null,
    checkoutText ? `夜のメモ: ${checkoutText}` : null,
    recentScores ? `直近スコア推移: ${recentScores}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 100,
    messages: [{ role: "user", content: dataStr }],
    system: SCORE_SYSTEM_PROMPT,
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  try {
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    return {
      condition_score: Math.min(
        100,
        Math.max(0, Math.round(parsed.condition_score ?? 50)),
      ),
      mind_score: Math.min(
        100,
        Math.max(0, Math.round(parsed.mind_score ?? 50)),
      ),
      body_score: Math.min(
        100,
        Math.max(0, Math.round(parsed.body_score ?? 50)),
      ),
    };
  } catch {
    return { condition_score: 50, mind_score: 50, body_score: 50 };
  }
}

async function generateCareComment(
  timing: "morning" | "checkout",
  ratings: TimePeriodRatings,
  activityTags: string[],
  freeText: string | null,
  checkedAt: string,
  recentCheckins: Array<{
    checked_at: string;
    condition_score: number | null;
    activity_tags: string[];
  }>,
  morningContext?: {
    ratings: TimePeriodRatings;
    tags: string[];
    text: string | null;
  },
): Promise<string> {
  const timeStr = formatHCMTime(checkedAt);
  const label = timing === "morning" ? "朝チェックイン" : "夜チェックアウト";

  const scoreHistory = recentCheckins
    .filter((c) => c.condition_score !== null)
    .slice(-7)
    .map((c) => {
      const d = new Date(c.checked_at);
      return `${d.getMonth() + 1}/${d.getDate()}: ${c.condition_score}点`;
    })
    .join(", ");

  const tagCounts = countTags(recentCheckins.map((c) => c.activity_tags));
  const topTags = topTagsText(tagCounts, 6);

  const lines: string[] = [
    `${label}（${timeStr}）`,
    `評価: ${ratingsToText(ratings)}`,
    activityTags.length ? `今日の活動: ${activityTags.join("、")}` : "",
    freeText ? `メモ: ${freeText}` : "",
  ];

  if (morningContext) {
    lines.push(`朝の評価: ${ratingsToText(morningContext.ratings)}`);
    if (morningContext.tags.length)
      lines.push(`朝の活動: ${morningContext.tags.join("、")}`);
    if (morningContext.text) lines.push(`朝のメモ: ${morningContext.text}`);
  }

  lines.push("");
  lines.push(`直近スコア: ${scoreHistory || "データなし"}`);
  lines.push(`よく見られた活動: ${topTags || "データなし"}`);

  const msg = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: lines.filter(Boolean).join("\n") }],
    system: CARE_SYSTEM_PROMPT,
  });

  const content = msg.content[0];
  return content.type === "text" ? content.text : "お疲れさまです。";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { time_period_ratings, activity_tags = [], free_text, timing } = body;

  if (!time_period_ratings || typeof time_period_ratings !== "object") {
    return NextResponse.json(
      { error: "time_period_ratings is required" },
      { status: 400 },
    );
  }

  const checkedAt = new Date().toISOString();

  // 過去7日のチェックインを取得（AIコンテキスト用）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentCheckins } = await supabase
    .from("checkins")
    .select(
      "checked_at, condition_score, activity_tags, time_period_ratings, timing, free_text",
    )
    .gte("checked_at", sevenDaysAgo.toISOString())
    .order("checked_at", { ascending: true });

  let condition_score: number | null = null;
  let mind_score: number | null = null;
  let body_score: number | null = null;
  let morningContext:
    | { ratings: TimePeriodRatings; tags: string[]; text: string | null }
    | undefined;

  if (timing === "checkout") {
    // 今日の朝チェックインを取得
    const todayStr = checkedAt.split("T")[0];
    const todayMorning = (recentCheckins || []).find(
      (c) => c.checked_at.startsWith(todayStr) && c.timing === "morning",
    );

    if (todayMorning) {
      morningContext = {
        ratings: (todayMorning.time_period_ratings as TimePeriodRatings) ?? {},
        tags: todayMorning.activity_tags ?? [],
        text: todayMorning.free_text ?? null,
      };
    }

    // スコア推移テキスト
    const scoreHistory = (recentCheckins || [])
      .filter((c) => c.condition_score !== null)
      .slice(-7)
      .map(
        (c) =>
          `${new Date(c.checked_at).getMonth() + 1}/${new Date(c.checked_at).getDate()}: ${c.condition_score}点`,
      )
      .join(", ");

    // AIで3スコア算出
    const scores = await calculateScoresWithAI(
      morningContext?.ratings ?? null,
      morningContext?.tags ?? [],
      morningContext?.text ?? null,
      time_period_ratings as TimePeriodRatings,
      activity_tags,
      free_text ?? null,
      scoreHistory,
    );

    condition_score = scores.condition_score;
    mind_score = scores.mind_score;
    body_score = scores.body_score;
  }

  // Careコメント生成
  const ai_comment = await generateCareComment(
    timing,
    time_period_ratings as TimePeriodRatings,
    activity_tags,
    free_text ?? null,
    checkedAt,
    recentCheckins || [],
    morningContext,
  );

  const { data, error } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      timing,
      time_period_ratings,
      activity_tags,
      free_text: free_text || null,
      condition_score,
      mind_score,
      body_score,
      ai_comment,
      checked_at: checkedAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkin: data });
}
