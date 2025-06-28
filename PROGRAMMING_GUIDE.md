# 🎭 お笑いエントリーシステム プログラミング解説ガイド

## 時間制限の仕組み

```typescript
// app/page.tsx より抜粋
const canSubmit = () => {
  if (!currentTime) return false
  const testDate = new Date('2025-06-20T17:50:00')
  const testEndDate = new Date('2025-06-20T19:00:00')
  return currentTime >= testDate && currentTime < testEndDate
}
```

**解説：**
1. `canSubmit()` - エントリー可能かチェックする関数
2. `currentTime` - 現在時刻（1秒ごとに更新）
3. `testDate` - エントリー開始時刻
4. `testEndDate` - エントリー終了時刻
5. `>=` と `<` で時間範囲をチェック

### 振り分けアルゴリズムの核心部分

```typescript
// lib/assignment.ts より抜粋
for (const entry of entries) {
  const preferences1 = [
    entry.preference1_1,
    entry.preference1_2,
    entry.preference1_3
  ].filter(Boolean) // 空でない希望のみ

  for (const pref of preferences1) {
    // 希望日程に対応するライブを検索
    const live = lives.find(l => {
      const liveDate = l.date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }).replace('2025年', '')
      return liveDate === pref
    })

    if (!live) continue // ライブが見つからない場合はスキップ

    const currentCount = assignedPerLive.get(live.id) || 0
    const capacity = capacityMap.get(live.id) || 0
    const repCount = assignedRepresentatives.get(entry.representative1) || 0

    // 配置可能かチェック
    if (
      currentCount < capacity &&           // 定員内
      !assignedNames.has(entry.name1) &&   // 名義重複なし
      repCount < 2                         // 代表者月2回以内
    ) {
      // 配置実行
      result.assignments.push({
        entryId: entry.id,
        liveId: live.id,
        nameIndex: 1
      })
      // カウンターを更新
      assignedPerLive.set(live.id, currentCount + 1)
      assignedNames.add(entry.name1)
      assignedRepresentatives.set(entry.representative1, repCount + 1)
      assigned1 = true
      break // 配置完了したらループ終了
    }
  }
}
```

**アルゴリズムの流れ：**
1. **エントリーを順番に処理**（時間順）
2. **希望日程を順番にチェック**（第1→第2→第3希望）
3. **制約条件の確認**
   - 定員内か？
   - 同じ名義がすでに出演していないか？
   - 代表者が月2回を超えていないか？
4. **条件をクリアしたら配置**
5. **次のエントリーへ**

### リアルタイム時計の実装

```typescript
// app/page.tsx より抜粋
useEffect(() => {
  setMounted(true)
  setCurrentTime(new Date())
  
  const timer = setInterval(() => {
    const now = new Date()
    setCurrentTime(now)
    
    // エントリー可能時間のチェック
    const testDate = new Date('2025-06-20T17:50:00')
    const testEndDate = new Date('2025-06-20T19:00:00')
    
    if (now >= testDate && now < testEndDate) {
      setIsEntryOpen(true)
    } else {
      setIsEntryOpen(false)
    }
  }, 1000) // 1000ms = 1秒ごとに実行

  return () => clearInterval(timer) // コンポーネント終了時にタイマーを停止
}, [])
```

**Reactの`useEffect`フック：**
- コンポーネントが画面に表示された時に実行
- `setInterval` で1秒ごとに時刻を更新
- `clearInterval` でメモリリークを防ぐ

## データベース操作の実例

### エントリーデータの保存

```typescript
// app/api/entry/route.ts より抜粋
const entry = await prisma.entry.create({
  data: {
    entryNumber: parseInt(data.entryNumber),
    name1: data.name1,
    representative1: data.representative1,
    preference1_1: data.preference1_1 || null,
    preference1_2: data.preference1_2 || null,
    preference1_3: data.preference1_3 || null,
    name2: data.name2 || null,
    representative2: data.representative2 || null,
    preference2_1: data.preference2_1 || null,
    preference2_2: data.preference2_2 || null,
    preference2_3: data.preference2_3 || null,
    email: data.email,
    liveType: data.liveType,
  },
})
```

**Prismaの特徴：**
- `create()` でデータを作成
- 型安全（間違った型を入れるとエラー）
- 自動でSQLクエリを生成

### データの取得と表示

```typescript
// app/schedule/page.tsx より抜粋
const lives = await prisma.live.findMany({
  where: {
    date: {
      gte: new Date('2025-07-01'), // 2025年7月1日以降
      lt: new Date('2025-08-01')   // 2025年8月1日未満
    }
  },
  include: {
    assignments: {        // 関連するassignmentも取得
      include: {
        entry: true       // さらにentryも取得
      }
    }
  },
  orderBy: {
    date: 'asc'          // 日付順にソート
  }
})
```

## モダンUIの実装

### Tailwind CSSによるスタイリング

```css
/* app/globals.css より抜粋 */
.btn-primary {
  @apply relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-full font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl;
}

.glass-card {
  @apply bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20;
}
```

**Tailwindの利点：**
- クラス名だけでスタイルを適用
- レスポンシブデザインが簡単
- 一貫したデザインシステム

### アニメーションの実装

```css
.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

## API設計の考え方

### RESTful API

```
GET  /api/lives     → ライブ一覧取得
POST /api/entry     → エントリー送信
POST /api/assign    → 振り分け実行
GET  /api/admin/entries → エントリー一覧取得
```

### エラーハンドリング

```typescript
try {
  const response = await fetch('/api/entry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  if (response.ok) {
    router.push('/complete')
  } else {
    // エラー処理
    const errorData = await response.json()
    alert(errorData.error)
  }
} catch (error) {
  // ネットワークエラーなど
  alert('通信エラーが発生しました')
}
```

## 学習ポイント 🎯

### 初学者が注目すべき技術

1. **React/Next.js**
   - コンポーネント指向の考え方
   - useState, useEffect フックの使い方
   - ページルーティング

2. **TypeScript**
   - 型定義の重要性
   - エラーの早期発見
   - コードの可読性向上

3. **データベース設計**
   - テーブル間のリレーション
   - 制約の設定
   - インデックスの概念

4. **API設計**
   - RESTfulな設計
   - エラーハンドリング
   - セキュリティ（時間制限、バリデーション）

### このプロジェクトから学べること

1. **実際のビジネスロジックの実装**
   - 複雑な制約条件のあるアルゴリズム
   - 時間制限のあるシステム
   - 公平性を保つ仕組み

2. **フルスタック開発**
   - フロントエンドからバックエンドまで
   - データベース設計から運用まで
   - 一人で完結できるスキルセット

3. **モダンな開発手法**
   - TypeScriptによる型安全性
   - Prismaによる型安全なDB操作
   - Tailwind CSSによる効率的なスタイリング

### 次のステップの提案

1. **基礎を固める**
   - JavaScript の基本文法
   - HTML/CSS の理解
   - Git/GitHub の使い方

2. **React を深く学ぶ**
   - コンポーネントの概念
   - フックの仕組み
   - 状態管理

3. **バックエンドを学ぶ**
   - API設計
   - データベース設計
   - セキュリティの基本

4. **実際にプロジェクトを作る**
   - 小さなアプリから始める
   - GitHub で公開する
   - フィードバックをもらう

## まとめ

このお笑いエントリーシステムは、見た目はシンプルですが、内部では多くの現代的なWeb開発技術が使われています：

- **フロントエンド**: React/Next.js + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes + Prisma
- **データベース**: SQLite/PostgreSQL
- **デプロイ**: Vercel対応

初学者の方でも、一つずつ理解していけば、必ず作れるようになります。大切なのは、実際に手を動かして、エラーを経験しながら学ぶことです。

プログラミングは「魔法」ではありません。論理的な思考と、基本的なパターンの組み合わせです。このプロジェクトが、あなたのプログラミング学習の参考になれば幸いです！

## 推奨学習リソース

1. **JavaScript/TypeScript**
   - MDN Web Docs
   - TypeScript公式ドキュメント

2. **React/Next.js**
   - React公式チュートリアル
   - Next.js公式ドキュメント

3. **データベース**
   - Prisma公式ガイド
   - SQL基礎

4. **実践**
   - GitHub での公開
   - 小さなプロジェクトから始める
   - コミュニティへの参加

頑張って学習を続けてください！🚀