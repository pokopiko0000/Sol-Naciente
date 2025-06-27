# Project: owarai_entry

## Overview
お笑い劇場のライブエントリー業務をデジタル化するシステム。公平性の確保と業務効率化を実現する（最小コストで最大効果）。

## 対象ライブ
- **口火ライブ**: 毎月1日22:00エントリー開始、月10-15回開催、各回9-11組
- **二足のわらじライブ**: 毎月10日22:00エントリー開始、月4回開催、各回16-17組

## 技術スタック
- **フロントエンド**: Next.js 14 + TypeScript
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL（Vercel提供無料枠）
- **インフラ**: Vercel
- **スタイリング**: Tailwind CSS

## URL構成
- `/` - エントリーフォーム
- `/schedule` - 交番表ページ
- `/admin` - スタッフ管理画面

## 主要機能
1. **エントリー機能（演者向け）**
   - 一括エントリーフォーム（最大2名義まで）
   - 21:50から入力可能、22:00送信開始、22:30自動締切
   - 第1〜第3希望まで選択可能

2. **自動振り分け機能**
   - 受付時刻順での先着優先
   - 同一名義：月1回まで
   - 同一個人：月2回まで（代表者名で判定）

3. **交番表ページ**
   - 出演結果の確認（23:00頃更新）
   - 常時閲覧可能

4. **管理機能（スタッフ向け）**
   - エントリー状況監視
   - 振り分け結果の確認・調整
   - 交番表確定機能

## 性能要件
- 同時アクセス: 1,000ユーザー対応
- レスポンス時間: エントリー送信5秒以内
- スマホ最適化必須

## Project Structure
- Git repository with main branch
- Working directory: `/mnt/c/Users/j_mar/OneDrive/ドキュメント/owarai_entry`
- 要件定義書: `/要件定義書.md`

## Development Guidelines
1. Follow existing code conventions and patterns in the project
2. Check for existing libraries before adding new dependencies
3. Run appropriate lint and type checking commands before completing tasks
4. Only commit changes when explicitly requested by the user
5. Mobile-first responsive design with Tailwind CSS
6. Ensure performance requirements are met (1000 concurrent users)

## Testing
- Check README or search codebase to determine testing approach before running tests
- Never assume specific test frameworks

## Important Notes
- This is a Windows WSL2 environment (Linux subsystem)
- Current date context: 2025-06-20
- Platform: Linux 6.6.87.2-microsoft-standard-WSL2

## Commands to Run
(To be updated as discovered)
- Lint: [TBD - ask user when needed]
- Type check: [TBD - ask user when needed]
- Test: [TBD - ask user when needed]
- Build: [TBD - ask user when needed]