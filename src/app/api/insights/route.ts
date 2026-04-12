import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { TimePeriodRatings } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 過去7日分のデータを取得
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: checkins } = await supabase
    .from('checkins')
    .select('checked_at, timing, time_period_ratings, activity_tags, condition_score')
    .gte('checked_at', sevenDaysAgo.toISOString())
    .order('checked_at', { ascending: true });

  if (!checkins || checkins.length === 0) {
    return NextResponse.json({ error: 'データが不足しています' }, { status: 400 });
  }

  // 評価分布の集計（A/B/C）
  const ratingCounts: Record<string, number> = { A: 0, B: 0, C: 0 };
  checkins.forEach(c => {
    const ratings = c.time_period_ratings as TimePeriodRatings | null;
    if (ratings) {
      Object.values(ratings).forEach(r => {
        if (r in ratingCounts) ratingCounts[r]++;
      });
    }
  });
  const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
  const ratingText = totalRatings > 0
    ? `良い(A): ${ratingCounts.A}回、普通(B): ${ratingCounts.B}回、悪い(C): ${ratingCounts.C}回`
    : 'データなし';

  // 活動タグの集計
  const allActivities = checkins.flatMap(c => c.activity_tags || []);
  const activityCounts: Record<string, number> = {};
  allActivities.forEach(tag => { activityCounts[tag] = (activityCounts[tag] || 0) + 1; });
  const topActivities = Object.entries(activityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => `${tag}(${count}回)`)
    .join('、');

  const validScores = checkins.filter(c => c.condition_score !== null);
  const avgScore = validScores.length > 0
    ? validScores.reduce((sum, c) => sum + (c.condition_score || 0), 0) / validScores.length
    : 0;

  const summary = `チェックイン回数: ${checkins.length}回、平均コンディションスコア: ${avgScore.toFixed(1)}、評価分布: ${ratingText}、よく見られた活動: ${topActivities || 'なし'}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 600,
    messages: [{ role: 'user', content: summary }],
    system: `過去7日間のコンディションデータを分析して、ユーザーへの週次インサイトを日本語で返してください。
ポジティブな視点を基本としつつ、正直に。
必ず以下の形式で3つのセクションに分けて出力してください（ラベルをそのまま使用）：

【今週のまとめ】
平均スコアとチェックイン結果の要約を1〜2文で。

【気づき】
活動と体調の相関・傾向を1〜2文で。

【来週への提案】
具体的なアクションを1文で。

ラベル行以外はプレーンテキストのみ返してください。`,
  });

  const insightContent = message.content[0];
  const insightText = insightContent.type === 'text' ? insightContent.text : '';

  // 今週の月曜日を計算
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // upsert
  const { data, error } = await supabase
    .from('weekly_insights')
    .upsert({
      user_id: user.id,
      week_start: weekStartStr,
      insight_text: insightText,
      avg_score: avgScore,
    }, { onConflict: 'user_id,week_start' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ insight: data });
}
