import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 簡易認証チェック
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count = 30, liveType = 'KUCHIBE' } = await request.json()

    // 既存のテストエントリーを削除（テスト用のみ）
    await prisma.entry.deleteMany({
      where: {
        email: {
          contains: '@test.com'
        }
      }
    })

    // テスト用ライブ日程
    const testDates = [
      '7月5日(土)',
      '7月8日(火)',
      '7月10日(木)',
      '7月12日(土)',
      '7月15日(火)',
      '7月17日(木)',
      '7月19日(土)',
      '7月22日(火)',
      '7月24日(木)',
      '7月26日(土)'
    ]

    // テスト用コンビ名
    const testNames = [
      'お笑いマスターズ', 'コメディキングス', 'ラフメーカーズ', 'ジョークボンバーズ', 'ガグファクトリー',
      'スマイルブラザーズ', 'ハッピーデュオ', 'ドリームコメディ', 'サニーサイド', 'ミラクルツインズ',
      'フレッシュコンビ', 'エナジーパートナーズ', 'クレイジーデュオ', 'ファニーメイツ', 'ワンダーペア',
      'チャーミングコンビ', 'ブライトスターズ', 'ハッピーエンド', 'ジョイフルコンビ', 'ラッキーチャンス',
      'マジックコンビ', 'サプライズデュオ', 'グッドタイムズ', 'フレンドリーコンビ', 'ナイスガイズ',
      'ポジティブペア', 'グレートコンビ', 'アメージングデュオ', 'ファンタスティック', 'エクセレント',
      '新人コンビA', '新人コンビB', '新人コンビC', '新人コンビD', '新人コンビE',
      '新人コンビF', '新人コンビG', '新人コンビH', '新人コンビI', '新人コンビJ'
    ]

    // テスト用代表者名
    const testRepresentatives = [
      '田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '伊藤健太',
      '渡辺由美', '山本浩二', '中村愛', '小林大輔', '加藤真理',
      '吉田和也', '山田麻衣', '松本隆', '井上美穂', '木村拓也',
      '林綾子', '森田剛', '清水恵子', '山口誠', '橋本直美',
      '石川達也', '斎藤美香', '後藤健', '坂田優子', '三浦信之',
      '野村千恵', '神田正男', '菊地沙織', '長谷川進', '福田真由美'
    ]

    const testEntries = []

    for (let i = 0; i < count; i++) {
      const entryNumber = Math.random() > 0.7 ? 2 : 1 // 30%の確率で2つエントリー

      // 第1希望を必ず設定、第2,3希望はランダム
      const preferences = [
        testDates[Math.floor(Math.random() * testDates.length)],
        Math.random() > 0.3 ? testDates[Math.floor(Math.random() * testDates.length)] : null,
        Math.random() > 0.6 ? testDates[Math.floor(Math.random() * testDates.length)] : null
      ]

      const entry = {
        entryNumber,
        name1: testNames[i % testNames.length] + (i > testNames.length ? `${Math.floor(i / testNames.length)}` : ''),
        representative1: testRepresentatives[i % testRepresentatives.length],
        preference1_1: preferences[0],
        preference1_2: preferences[1],
        preference1_3: preferences[2],
        name2: entryNumber === 2 ? `${testNames[(i + 10) % testNames.length]}セカンド` : null,
        representative2: entryNumber === 2 ? testRepresentatives[(i + 10) % testRepresentatives.length] : null,
        preference2_1: entryNumber === 2 ? testDates[Math.floor(Math.random() * testDates.length)] : null,
        preference2_2: entryNumber === 2 && Math.random() > 0.3 ? testDates[Math.floor(Math.random() * testDates.length)] : null,
        preference2_3: entryNumber === 2 && Math.random() > 0.6 ? testDates[Math.floor(Math.random() * testDates.length)] : null,
        email: `test${i + 1}@test.com`,
        lineUrl: Math.random() > 0.5 ? `https://line.me/ti/p/test${i + 1}` : null,
        liveType,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)) // 過去1時間以内のランダムなタイムスタンプ
      }

      testEntries.push(entry)
    }

    // バッチでエントリー作成
    const createdEntries = await prisma.$transaction(
      testEntries.map(entry => prisma.entry.create({ data: entry }))
    )

    return NextResponse.json({
      success: true,
      created: createdEntries.length,
      message: `${count}件のテストエントリーを作成しました`
    })

  } catch (error) {
    console.error('Test entry creation error:', error)
    return NextResponse.json(
      { error: 'テストエントリーの作成に失敗しました' },
      { status: 500 }
    )
  }
}