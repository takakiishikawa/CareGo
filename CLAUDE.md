@AGENTS.md

# CLAUDE.md

このプロダクトは **Goシリーズ** の一員です。  
Goシリーズ共通のデザインシステムは `@takaki/go-design-system` リポで管理されています。

## 絶対に守るルール（最重要）

### 1. UIコンポーネントは必ず @takaki/go-design-system から import する

- ✅ 正しい：`import { Button, Card } from '@takaki/go-design-system'`
- ❌ NG：独自に `components/ui/button.tsx` を作る
- ❌ NG：shadcn/ui CLI で直接コンポーネントを追加する（このプロダクトには不要）

### 2. 必要なコンポーネントがない場合

独自に作らず、以下のいずれかを選ぶ：
- 既存コンポーネントの組み合わせで実現できないか検討
- どうしても必要な場合は、go-design-systemリポに追加する旨を明記して作業を止める

独自実装は絶対にしない。

### 3. デザイントークンの上書き禁止

許可されている上書き：
- `--color-primary`（このプロダクトのブランドカラー）
- `--color-primary-hover`

禁止されている上書き：
- 色（上記以外全て）
- 角丸（`--radius-*`）
- フォントサイズ（`--text-*`）
- 余白（`--space-*`）
- シャドウ（`--shadow-*`）

### 4. className の使用範囲

許可：
- レイアウト（`flex`, `grid`, `gap`, `justify-*`, `items-*`）
- 配置（`margin`, `padding` でトークン値を使う場合）
- レスポンシブ制御（`md:`, `lg:`）

禁止：
- 色の直接指定（`bg-red-500`, `text-blue-600` など）
- 固定値の角丸（`rounded-lg` など、トークン経由で使う）
- 独自のシャドウ
- カスタムフォントサイズ

### 5. アイコンは lucide-react に統一

- ✅ `import { Zap } from 'lucide-react'`
- ❌ 他のアイコンライブラリを追加しない

### 6. レイアウトパターンはテンプレートから派生させる

新規画面を作る時：
- ダッシュボード系 → `DashboardPage` テンプレートから派生
- サイドバー → `AppSidebar` をそのまま使用
- 認証画面 → `LoginPage` テンプレート
- コンセプト画面 → `ConceptPage` テンプレート

ゼロからレイアウトを組まない。

### 7. AppSwitcher の設定

`AppSidebar` には `AppSwitcher` が組み込まれています。以下の設定を `app/layout.tsx` で行ってください：

```tsx
const apps = [
  { name: 'NativeGo', url: 'https://native-go.vercel.app', color: '#E74C3C' },
  { name: 'CareGo',   url: 'https://care-go.vercel.app',   color: '#2D8A5F' },
  // ... 全Goを記述
]

<AppSidebar currentApp="CareGo" apps={apps} />
```

## CSS の読み込み方（Tailwind v4 + Turbopack 必須）

**⚠️ CSS ファイルの `import` / `@import` は使わない。** Tailwind v4 + Turbopack では node_modules の CSS を `@import` すると PostCSS 処理が失敗する。

**正しい方法：`DesignTokens` コンポーネントを `app/layout.tsx` の `<head>` に置く**

```tsx
// app/layout.tsx
import './globals.css'
import { DesignTokens } from '@takaki/go-design-system'

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <DesignTokens
          primaryColor="#2D8A5F"
          primaryColorHover="#226b49"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Tailwind がコンポーネントのクラス名をスキャンできるよう `app/globals.css` に `@source` を追加：

```css
/* app/globals.css */
@import "tailwindcss";
@source "../node_modules/@takaki/go-design-system/dist";
```

## デザインシステムの更新への追従

このプロダクトは `@takaki/go-design-system` に依存しており、デザインシステムの更新はVercelのBuild Commandで自動反映されます：

```json
// vercel.json
{
  "buildCommand": "npm update @takaki/go-design-system && npm run build"
}
```

ローカル開発時に最新を取りに行きたい場合：

```bash
npm update @takaki/go-design-system
```

## プライマリカラーの決定ルール

各Goのプライマリカラー（および必要に応じてセカンダリカラー）は、以下の判断材料を総合してClaude Codeが自律的に決定する：

1. このプロダクトのコンセプト
   - コアバリュー
   - 解決している課題
   - ターゲットユーザーの心理状態

2. 既存のデザインで使われていた色（あれば参照）

3. go-design-system のデザイン原則（角丸控えめ、ニュートラル主役、機能美）

事前にTakakiの判断を仰ぐ必要はない。コンセプト起点で適切に判断し、globals.css に適用する。

選定理由は CLAUDE.md の「プライマリカラー」セクションに簡潔に記載し、将来の見直し時に参照できるようにする。

## このプロダクト固有のルール

- プロダクト名：`CareGo`
- プライマリカラー：`#2D8A5F`（フォレストグリーン — 健康・自己ケア・落ち着きを連想。wellness/health文脈でも定番の色相）
- ドメイン：`https://care-go.vercel.app`
- データモデルの概要：
  - `checkins` テーブル：朝チェックイン／夜チェックアウトの記録（timing, mood, scores, activities, AI comment）
  - `meditations` テーブル：瞑想ログ（日付、タイミング）
  - `profiles` テーブル：ユーザープロフィール（表示名）
  - `push_subscriptions` テーブル：Web Push 通知購読
- 外部連携：
  - **Supabase** — 認証（Google OAuth）・DB・Row Level Security
  - **Anthropic Claude API** — チェックイン後のAIコメント生成（CareキャラクターとしてPromptを設定）
  - **Web Push** — 朝のチェックインリマインダー（cron: 毎日10:00 JST）

## 作業時の判断基準

1. 新しいUIが必要 → まず `@takaki/go-design-system` に該当コンポーネントがあるか確認
2. ある → それを使う
3. ない → 既存の組み合わせで実現できないか検討
4. それも無理 → 作業を止めて、go-design-system 側への追加を提案

独自実装は最後の手段であり、原則として行わない。
