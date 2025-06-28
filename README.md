# 🎭 お笑い劇場エントリーシステム

お笑い劇場のライブエントリー業務をデジタル化し、公平性の確保と業務効率化を実現するWebアプリケーションです。

## ✨ 主な機能

- **⏰ 時間制限付きエントリーフォーム**: 毎月1日・10日の22:00-22:30のみ受付
- **🤖 自動振り分けアルゴリズム**: 公平性を保つ先着順+制約条件での自動配置
- **📱 モダンレスポンシブUI**: Glassmorphismデザインとアニメーション
- **👥 管理者ダッシュボード**: エントリー監視と振り分け結果管理
- **📊 リアルタイム交番表**: 出演結果の即座確認

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14 + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Prisma + SQLite (開発) / PostgreSQL (本番)
- **インフラ**: Vercel
- **スタイリング**: Tailwind CSS + カスタムアニメーション

## 🚀 クイックスタート

### 1. 依存関係のインストール
```bash
npm install
```

### 2. データベースの初期化
```bash
npm run db:init
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

### 4. アクセス先
- **エントリーフォーム**: http://localhost:3000
- **交番表**: http://localhost:3000/schedule
- **管理画面**: http://localhost:3000/admin

## 🎯 対象ライブ

- **口火ライブ**: 毎月1日22:00エントリー開始、月10-15回開催、各回9-11組
- **二足のわらじライブ**: 毎月10日22:00エントリー開始、月4回開催、各回16-17組

## 🏗️ プロジェクト構成

```
app/
├── page.tsx              # エントリーフォーム
├── admin/page.tsx        # 管理画面
├── schedule/page.tsx     # 交番表
├── complete/page.tsx     # 完了画面
└── api/                  # API endpoints
    ├── entry/route.ts    # エントリー送信
    ├── assign/route.ts   # 自動振り分け
    └── lives/route.ts    # ライブ情報取得

lib/
├── db.ts                 # データベース接続
└── assignment.ts         # 振り分けアルゴリズム

prisma/
├── schema.prisma         # データベーススキーマ
└── seed-test.ts         # テストデータ作成
```

## 📊 データベース設計

### Entry（エントリー）
- 名義1/名義2（最大2組まで）
- 代表者名
- 希望日程（第1〜第3希望）
- メールアドレス
- エントリー時刻

### Live（ライブ）
- 開催日時
- ライブタイプ（口火/二足のわらじ）
- 定員

### Assignment（割り当て）
- エントリーとライブの関連付け
- 名義番号
- ステータス

## 🤖 振り分けアルゴリズム

1. **基本方針**: 受付時刻順での先着優先
2. **制約条件**:
   - 同一名義：月1回まで
   - 同一個人：月2回まで（代表者名で判定）
   - 各回の組数：口火9-11組、二足のわらじ16-17組
3. **処理順序**:
   - エントリー時刻順でソート
   - 第1希望から順番に配置試行
   - 制約違反の場合は次の希望で再試行
   - 全希望で配置不可の場合は補欠リスト

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# データベース初期化
npm run db:init

# データベースリセット
npm run db:reset

# テストデータ作成
npm run db:seed

# ビルド
npm run build

# 本番サーバー起動
npm run start
```

## 🧪 テスト環境

現在のシステムは**テストモード**で動作しています：
- エントリー受付時間: 17:50-19:00（本日のみ）
- 対象ライブ: 2025年7月口火ライブ
- 時間制限無効化: `DISABLE_TIME_RESTRICTION=true`

## 🌐 デプロイ（Vercel）

### 1. 環境変数設定
```
DATABASE_URL="postgresql://user:password@host:5432/database"
NODE_ENV="production"
```

### 2. 運用コスト
- Vercel: 無料枠（ピーク時のみPro $20/月）
- PostgreSQL: Vercel Postgres 無料枠
- **合計**: 平常時無料、ピーク時$20/月

## 📖 ドキュメント

- **[プログラミング解説ガイド](./PROGRAMMING_GUIDE.md)** - 初学者向け詳細技術解説
- **[要件定義書](./要件定義書.md)** - システム仕様と業務要件
- **[Claude向け開発ガイド](./CLAUDE.md)** - 開発環境情報

## 🔧 重要な設定ファイル

- `.env`: 環境変数（ローカル開発用）
- `DISABLE_TIME_RESTRICTION=true`: テスト時の時間制限無効化
- `lib/assignment.ts`: 振り分けアルゴリズムの核心
- `app/globals.css`: モダンUIスタイル定義

## 💰 運用コスト

- **平常時**: 無料（Vercel + Vercel Postgres 無料枠）
- **ピーク時**: $20/月（Vercel Pro プラン）

## 🤝 貢献

このプロジェクトへの貢献を歓迎します。改善提案やバグ報告はIssueでお知らせください。

## 📄 ライセンス

MIT License

---

**開発者向け**: 詳細な技術解説は [PROGRAMMING_GUIDE.md](./PROGRAMMING_GUIDE.md) をご覧ください。