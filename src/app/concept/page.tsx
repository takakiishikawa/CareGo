import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConceptPage } from '@takaki/go-design-system';
import Logo from '@/components/ui/Logo';

export default async function ConceptPageRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <ConceptPage
      productName="CareGo"
      productLogo={<Logo size="md" />}
      tagline="コンディション管理ツール"
      coreMessage="コンディションが良い時、学習・仕事・人間関係、あらゆることがうまく回る。コンディションが落ちると、同じことをしても結果が出ない。"
      coreValue="安定した良いコンディション"
      scope={{
        solve: [
          '日常のコンディションの波を観察・認識すること',
          '良い状態を安定させること',
          '習慣の改善につながる気づきを提供すること',
        ],
        notSolve: [
          '臨床的なメンタルヘルス疾患の治療・診断',
          'カウンセリングや医療の代替',
          '人とのつながりを直接増やすこと',
          'やりたいことをやりたいに変えること',
        ],
      }}
      productLogic={{
        steps: [
          {
            title: 'チェックイン',
            description: '朝・夜、気分と感情を記録',
          },
          {
            title: 'フィードバック',
            description: 'スコアと短いコメントを即時返す',
          },
          {
            title: '瞑想',
            description: 'ログが自動記録される',
          },
          {
            title: 'インサイト',
            description: '週次データを自動分析',
          },
          {
            title: '行動変化',
            description: '気づきが習慣の改善につながる',
          },
        ],
        outcome: '週次スコア平均の安定・向上',
      }}
      resultMetric={{
        title: '週次スコア平均の安定・向上',
        description: 'コンディションスコアの週次平均値が継続的に高く安定していること',
      }}
      behaviorMetrics={[
        {
          title: 'チェックイン入力率',
          description: '朝・夜の記録を継続すること（日単位）',
        },
        {
          title: '瞑想実施回数',
          description: '週単位での瞑想ログ数',
        },
      ]}
    />
  );
}
