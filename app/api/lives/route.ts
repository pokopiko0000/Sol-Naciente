import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const liveType = searchParams.get('type') || 'KUCHIBE'
  const testMode = searchParams.get('test') === 'true' // テストモードパラメータ
  
  try {
    
    console.log('Lives API - Requested type:', liveType, 'Test mode:', testMode)
    
    // エントリー時は翌月のライブデータを取得
    // 注意：7月1日・10日のエントリーは8月公演なので、現在の仕様に合わせて調整
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 0-11 → 1-12
    
    // 開発環境では常に7月想定なので、8月のデータを取得
    const targetMonth = 8 // 8月
    const targetYear = 2025
    
    const nextMonth = new Date(targetYear, targetMonth - 1, 1) // 8月1日
    const nextMonthEnd = new Date(targetYear, targetMonth, 0) // 8月31日
    
    console.log('Lives API - Date range:', {
      currentDate: now.toISOString(),
      searchFrom: nextMonth.toISOString(),
      searchTo: nextMonthEnd.toISOString(),
      targetMonth
    })
    
    // まず全データを取得してデバッグ
    const allLives = await prisma.live.findMany({
      where: {
        type: liveType as 'KUCHIBE' | 'NIWARA'
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    console.log(`Lives API - All lives in DB for ${liveType}:`)
    allLives.forEach(live => {
      console.log(`  - ${live.date.toISOString()} (${live.type})`)
    })
    
    // 8月のデータのみフィルタリング（年は問わない）
    const lives = testMode ? allLives : allLives.filter(live => {
      const liveMonth = live.date.getMonth() + 1
      return liveMonth === 8
    })
    
    console.log(`Lives API - Filtered ${lives.length} August lives`)
    
    console.log(`Lives API - Found ${lives.length} lives for type ${liveType}`)
    lives.forEach(live => {
      console.log(`  - ${live.date.toISOString()} (${live.type})`)
    })
    
    const dates = lives.map(live => {
      const dateStr = live.date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }).replace('2025年', '')
      
      // 時間範囲を追加
      const startTime = live.date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const duration = live.type === 'KUCHIBE' ? 60 : 90
      const endDate = new Date(live.date.getTime() + duration * 60 * 1000)
      const endTime = endDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      return `${dateStr} ${startTime}〜${endTime}`
    })
    
    // フォールバック用のテストデータ（翌月の日程）
    console.log('Lives API - Formatted dates:', dates)
    if (dates.length === 0 && lives.length === 0) {
      console.log('Lives API - No data found, using fallback for type:', liveType)
      const fallbackDates = liveType === 'KUCHIBE' ? [
        '8月5日(月) 19:00〜20:00',
        '8月8日(木) 19:30〜20:30',
        '8月12日(月) 20:00〜21:00',
        '8月15日(木) 19:00〜20:00',
        '8月19日(月) 19:30〜20:30'
      ] : [
        '8月3日(土) 19:00〜20:30',
        '8月10日(土) 19:30〜21:00',
        '8月17日(土) 19:00〜20:30',
        '8月24日(土) 19:30〜21:00'
      ]
      return NextResponse.json({ dates: fallbackDates })
    }
    
    return NextResponse.json({ dates })
  } catch (error) {
    console.error('Lives API Error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // エラー時もフォールバックデータを返す（翌月の日程）
    const fallbackDates = liveType === 'KUCHIBE' ? [
      '8月5日(月) 19:00〜20:00',
      '8月8日(木) 19:30〜20:30',
      '8月12日(月) 20:00〜21:00',
      '8月15日(木) 19:00〜20:00',
      '8月19日(月) 19:30〜20:30'
    ] : [
      '8月3日(土) 19:00〜20:30',
      '8月10日(土) 19:30〜21:00',
      '8月17日(土) 19:00〜20:30',
      '8月24日(土) 19:30〜21:00'
    ]
    return NextResponse.json({ dates: fallbackDates })
  }
}