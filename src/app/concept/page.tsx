import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConceptPage } from "@takaki/go-design-system";

const LeafIcon = () => (
  <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
    <path
      d="M14 2C14 2 5 10.5 5 17C5 21.9706 9.02944 26 14 26C18.9706 26 23 21.9706 23 17C23 10.5 14 2 14 2Z"
      fill="var(--color-primary, #2D8A5F)"
    />
    <path
      d="M14 26V17"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M10.5 20.5C10.5 18.567 12.067 17 14 17"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export default async function ConceptPageRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ConceptPage
      productName="CareGo"
      productLogo={<LeafIcon />}
      tagline="コンディション管理ツール"
      coreMessage="コンディションが良い時、学習・仕事・人間関係、あらゆることがうまく回る。コンディションが落ちると、同じことをしても結果が出ない。"
      coreValue="安定した良いコンディション"
      scope={{
        solve: [
          "日常のコンディションの波を観察・認識すること",
          "良い状態を安定させること",
          "習慣の改善につながる気づきを提供すること",
        ],
        notSolve: [
          "臨床的なメンタルヘルス疾患の治療・診断",
          "カウンセリングや医療の代替",
          "人とのつながりを直接増やすこと",
          "やりたいことをやりたいに変えること",
        ],
      }}
      productLogic={{
        steps: [
          {
            title: "チェックイン",
            description: "朝・夜、気分と感情を記録",
          },
          {
            title: "フィードバック",
            description: "スコアと短いコメントを即時返す",
          },
          {
            title: "瞑想",
            description: "ログが自動記録される",
          },
          {
            title: "インサイト",
            description: "週次データを自動分析",
          },
          {
            title: "行動変化",
            description: "気づきが習慣の改善につながる",
          },
        ],
        outcome: "週次スコア平均の安定・向上",
      }}
      resultMetric={{
        title: "週次スコア平均の安定・向上",
        description:
          "コンディションスコアの週次平均値が継続的に高く安定していること",
      }}
      behaviorMetrics={[
        {
          title: "チェックイン入力率",
          description: "朝・夜の記録を継続すること（日単位）",
        },
        {
          title: "瞑想実施回数",
          description: "週単位での瞑想ログ数",
        },
      ]}
    />
  );
}
