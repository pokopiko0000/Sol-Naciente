# 📁 プロジェクト構成ガイド

このドキュメントでは、お笑いエントリーシステムのファイル構成と各ディレクトリの役割について説明します。

## 🏗️ フォルダ構成

```
owarai_entry/
├── 📄 設定・ドキュメントファイル
│   ├── README.md                    # プロジェクト概要
│   ├── PROGRAMMING_GUIDE.md         # 初学者向け技術解説
│   ├── CLAUDE.md                    # Claude向け開発情報
│   ├── 要件定義書.md                 # システム仕様書
│   ├── PROJECT_STRUCTURE.md         # このファイル
│   ├── package.json                 # 依存関係とスクリプト
│   ├── tsconfig.json                # TypeScript設定
│   ├── tailwind.config.ts           # Tailwind CSS設定
│   ├── next.config.js               # Next.js設定
│   ├── postcss.config.js            # PostCSS設定
│   ├── .env                         # 環境変数（ローカル）
│   ├── .env.example                 # 環境変数テンプレート
│   └── .gitignore                   # Git除外設定
│
├── 🖥️ app/ (Next.js App Router)
│   ├── page.tsx                     # トップページ（エントリーフォーム）
│   ├── layout.tsx                   # 共通レイアウト
│   ├── globals.css                  # グローバルスタイル
│   ├── admin/page.tsx               # 管理画面
│   ├── schedule/page.tsx            # 交番表
│   ├── complete/page.tsx            # エントリー完了画面
│   └── api/                         # API エンドポイント
│       ├── entry/route.ts           # エントリー送信API
│       ├── assign/route.ts          # 振り分け実行API
│       ├── lives/route.ts           # ライブ情報取得API
│       └── admin/                   # 管理系API
│           ├── entries/route.ts     # エントリー一覧取得
│           ├── lives/route.ts       # ライブ一覧取得
│           └── confirm/route.ts     # 交番表確定
│
├── 🛠️ lib/ (共通ライブラリ)
│   ├── db.ts                        # Prismaクライアント設定
│   ├── assignment.ts                # 振り分けアルゴリズム
│   └── utils/                       # ユーティリティ関数
│       ├── date.ts                  # 日付操作
│       └── validation.ts            # バリデーション
│
├── 🗄️ prisma/ (データベース)
│   ├── schema.prisma                # データベーススキーマ定義
│   ├── seed-test.ts                 # テストデータ作成
│   ├── dev.db                       # SQLiteデータベース（開発用）
│   └── migrations/                  # マイグレーションファイル
│       └── 20250619105806_init/
│           └── migration.sql
│
└── 📜 scripts/ (自動化スクリプト)
    └── init-db.js                  # データベース初期化スクリプト
```

## 📂 各ディレクトリの詳細

### 🖥️ `app/` - アプリケーションコア

Next.js 14のApp Routerを使用したメインアプリケーション。

#### ページファイル
- **`page.tsx`**: エントリーフォーム（時間制限、リアルタイム時計付き）
- **`admin/page.tsx`**: 管理画面（エントリー監視、振り分け実行）
- **`schedule/page.tsx`**: 交番表（結果表示）
- **`complete/page.tsx`**: エントリー完了確認
- **`layout.tsx`**: 全ページ共通レイアウト

#### API Routes
- **`api/entry/`**: エントリーデータの受信と保存
- **`api/assign/`**: 自動振り分けアルゴリズムの実行
- **`api/lives/`**: ライブ情報の取得
- **`api/admin/`**: 管理機能（エントリー一覧、確定処理）

### 🛠️ `lib/` - ビジネスロジック

#### 主要ファイル
- **`db.ts`**: Prismaクライアントの設定（シングルトンパターン）
- **`assignment.ts`**: 振り分けアルゴリズムの実装

#### `utils/` サブディレクトリ
- **`date.ts`**: 日付フォーマット、時間判定関数
- **`validation.ts`**: フォーム入力値の検証

### 🗄️ `prisma/` - データベース管理

- **`schema.prisma`**: データベーススキーマ定義
- **`seed-test.ts`**: 2025年7月のテストデータ生成
- **`migrations/`**: データベース変更履歴

### 📜 `scripts/` - 自動化

- **`init-db.js`**: ワンコマンドでのDB初期化スクリプト

## 🎯 重要なファイル

### 設定ファイル
1. **`.env`** - 環境変数（`DATABASE_URL`, `DISABLE_TIME_RESTRICTION`）
2. **`package.json`** - 依存関係とnpmスクリプト
3. **`tsconfig.json`** - TypeScript設定
4. **`tailwind.config.ts`** - UI設定

### コアロジック
1. **`lib/assignment.ts`** - 振り分けアルゴリズム
2. **`app/page.tsx`** - メインエントリーフォーム
3. **`app/globals.css`** - モダンUIスタイル
4. **`prisma/schema.prisma`** - データ構造定義

## 🚀 開発時の重要ポイント

### 開発環境
- **テスト時間**: 17:50-19:00（環境変数で制御）
- **データベース**: SQLite（`prisma/dev.db`）
- **時間制限**: `DISABLE_TIME_RESTRICTION=true`で無効化可能

### 本番環境
- **データベース**: PostgreSQL（Vercel Postgres）
- **時間制限**: 毎月1日・10日の22:00-22:30のみ
- **デプロイ**: Vercel

## 📋 開発ワークフロー

### 1. 新機能開発
```bash
# 1. 依存関係確認
npm install

# 2. データベース更新
npm run db:init

# 3. 開発サーバー起動
npm run dev

# 4. 機能実装
# - app/ でUI実装
# - lib/ でロジック実装
# - prisma/ でDB変更

# 5. テスト
# - エントリーフォームテスト
# - 管理画面での振り分けテスト
```

### 2. スタイル変更
- **`app/globals.css`** - カスタムスタイル
- **`tailwind.config.ts`** - Tailwind設定
- **各ページファイル** - Tailwindクラス使用

### 3. API変更
- **`app/api/`** - 新エンドポイント追加
- **`lib/`** - ビジネスロジック実装
- **`prisma/schema.prisma`** - データ構造変更

## 🔧 今後の拡張ポイント

### 機能追加時の推奨場所
1. **新しいページ**: `app/新ページ名/page.tsx`
2. **新しいAPI**: `app/api/新機能/route.ts`
3. **共通関数**: `lib/utils/`
4. **DB変更**: `prisma/schema.prisma`

### 設定変更
1. **環境変数**: `.env` と `.env.example`
2. **依存関係**: `package.json`
3. **TypeScript**: `tsconfig.json`
4. **スタイル**: `tailwind.config.ts`

## 📚 学習順序（初学者向け）

1. **基本理解**: `README.md` → `PROGRAMMING_GUIDE.md`
2. **データ構造**: `prisma/schema.prisma`
3. **UI実装**: `app/page.tsx` → `app/globals.css`
4. **API実装**: `app/api/entry/route.ts`
5. **ビジネスロジック**: `lib/assignment.ts`

この構成により、保守性と拡張性を両立したモダンなWebアプリケーションとなっています。