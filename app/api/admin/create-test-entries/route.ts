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

    const { count = 30 } = await request.json()

    // 既存のテストエントリーを削除（テスト用のみ）
    await prisma.entry.deleteMany({
      where: {
        email: {
          contains: '@test.com'
        }
      }
    })

    // テスト用ライブ日程（現在の月の日付を生成）
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    const testDates = []
    for (let day = 5; day <= 30; day += 3) {
      testDates.push(new Date(currentYear, currentMonth, day))
    }

    // テスト用インディーズ名
    const testIndiesNames = [
      'お笑いプロダクション東京', 'コメディエンターテイメント', 'ラフメーカープロ', 'ジョークファクトリー', 'ガグスタジオ',
      'スマイルプロダクション', 'ハッピーエンターテイメント', 'ドリームコメディ事務所', 'サニーサイドプロ', 'ミラクルエンタメ',
      'フレッシュプロダクション', 'エナジーエンターテイメント', 'クレイジーコメディ', 'ファニープロダクション', 'ワンダーエンタメ'
    ]

    // テスト用エントリー名
    const testEntryNames = [
      'お笑いマスターズ', 'コメディキングス', 'ラフメーカーズ', 'ジョークボンバーズ', 'ガグファクトリー',
      'スマイルブラザーズ', 'ハッピーデュオ', 'ドリームコメディ', 'サニーサイド', 'ミラクルツインズ',
      'フレッシュコンビ', 'エナジーパートナーズ', 'クレイジーデュオ', 'ファニーメイツ', 'ワンダーペア',
      'チャーミングコンビ', 'ブライトスターズ', 'ハッピーエンド', 'ジョイフルコンビ', 'ラッキーチャンス',
      'マジックコンビ', 'サプライズデュオ', 'グッドタイムズ', 'フレンドリーコンビ', 'ナイスガイズ',
      'ポジティブペア', 'グレートコンビ', 'アメージングデュオ', 'ファンタスティック', 'エクセレント'
    ]

    // 演目タイプ
    const performanceTypes = ['漫才（漫談）', 'コント', '未定']

    const testEntries = []

    for (let i = 0; i < count; i++) {
      const targetDate = testDates[Math.floor(Math.random() * testDates.length)]
      const performanceType = performanceTypes[Math.floor(Math.random() * performanceTypes.length)]

      const entry = {
        indies_name: testIndiesNames[i % testIndiesNames.length],
        entry_name: testEntryNames[i % testEntryNames.length] + (i >= testEntryNames.length ? `${Math.floor(i / testEntryNames.length) + 1}` : ''),
        performance_type: performanceType,
        target_date: targetDate,
        remarks: Math.random() > 0.7 ? `${targetDate.getDate()}日は出番を早めにしてください` : null,
        email: `test${i + 1}@test.com`,
        lineUrl: Math.random() > 0.5 ? `https://line.me/ti/p/test${i + 1}` : null,
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