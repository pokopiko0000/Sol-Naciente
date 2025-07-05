import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Lives API - Fetching lives for 日の出寄席')
    
    // 設定から募集対象年月を取得
    const settings = await prisma.settings.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    let targetYear: number
    let targetMonth: number

    if (settings && settings.target_year && settings.target_month) {
      // 設定で指定された年月を使用
      targetYear = settings.target_year
      targetMonth = settings.target_month
    } else {
      // フォールバック：翌月のライブデータを取得
      const now = new Date()
      const currentMonth = now.getMonth() + 1 // 0-11 → 1-12
      targetMonth = currentMonth === 12 ? 1 : currentMonth + 1
      targetYear = currentMonth === 12 ? now.getFullYear() + 1 : now.getFullYear()
    }
    
    const targetMonthStart = new Date(targetYear, targetMonth - 1, 1) // 対象月1日
    const targetMonthEnd = new Date(targetYear, targetMonth, 0) // 対象月末日
    
    console.log('Lives API - Date range:', {
      searchFrom: targetMonthStart.toISOString(),
      searchTo: targetMonthEnd.toISOString(),
      targetMonth,
      targetYear,
      fromSettings: !!(settings && settings.target_year && settings.target_month)
    })
    
    // 日の出寄席のライブデータを取得（演目情報も含む）
    const lives = await prisma.live.findMany({
      where: {
        date: {
          gte: targetMonthStart,
          lte: targetMonthEnd
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        id: true,
        date: true,
        capacity: true,
        allowed_performance_types: true
      }
    })
    
    console.log(`Lives API - Found ${lives.length} lives for 日の出寄席`)
    lives.forEach(live => {
      console.log(`  - ${live.date.toISOString()}`)
    })
    
    const liveData = lives.map(live => {
      // JST（日本時間）での日付表示を確実にするため、UTCオフセットを考慮
      const jstDate = new Date(live.date.getTime() + (9 * 60 * 60 * 1000))
      
      const dateStr = jstDate.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        timeZone: 'Asia/Tokyo'
      }).replace(`${targetYear}年`, '')
      
      // 開始・終了時間を追加（日の出寄席は1時間半固定）
      const startTime = jstDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
      
      const duration = 90 // 1時間半
      const endDate = new Date(jstDate.getTime() + duration * 60 * 1000)
      const endTime = endDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
      
      return {
        id: live.id,
        dateString: `${dateStr} ${startTime}〜${endTime}`,
        allowedPerformanceTypes: live.allowed_performance_types || []
      }
    })
    
    // フォールバック用のテストデータ（月6回開催）
    console.log('Lives API - Formatted live data:', liveData)
    if (liveData.length === 0) {
      console.log('Lives API - No data found, using fallback for 日の出寄席')
      
      // 月6回のサンプル日程を生成（1時間半固定）
      const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString('ja-JP', { month: 'long' })
      const fallbackLiveData = [
        { id: 'fallback-1', dateString: `${monthName}5日(火) 19:00〜20:30`, allowedPerformanceTypes: [] },
        { id: 'fallback-2', dateString: `${monthName}9日(土) 19:30〜21:00`, allowedPerformanceTypes: [] },
        { id: 'fallback-3', dateString: `${monthName}12日(火) 20:00〜21:30`, allowedPerformanceTypes: [] },
        { id: 'fallback-4', dateString: `${monthName}16日(土) 19:00〜20:30`, allowedPerformanceTypes: [] },
        { id: 'fallback-5', dateString: `${monthName}19日(火) 19:30〜21:00`, allowedPerformanceTypes: [] },
        { id: 'fallback-6', dateString: `${monthName}23日(土) 20:00〜21:30`, allowedPerformanceTypes: [] }
      ]
      return NextResponse.json({ lives: fallbackLiveData })
    }
    
    return NextResponse.json({ lives: liveData })
  } catch (error) {
    console.error('Lives API Error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // エラー時もフォールバックデータを返す（月6回開催）
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const targetMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const targetYear = currentMonth === 12 ? now.getFullYear() + 1 : now.getFullYear()
    const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString('ja-JP', { month: 'long' })
    
    const fallbackLiveData = [
      { id: 'fallback-1', dateString: `${monthName}5日(火) 19:00〜20:30`, allowedPerformanceTypes: [] },
      { id: 'fallback-2', dateString: `${monthName}9日(土) 19:30〜21:00`, allowedPerformanceTypes: [] },
      { id: 'fallback-3', dateString: `${monthName}12日(火) 20:00〜21:30`, allowedPerformanceTypes: [] },
      { id: 'fallback-4', dateString: `${monthName}16日(土) 19:00〜20:30`, allowedPerformanceTypes: [] },
      { id: 'fallback-5', dateString: `${monthName}19日(火) 19:30〜21:00`, allowedPerformanceTypes: [] },
      { id: 'fallback-6', dateString: `${monthName}23日(土) 20:00〜21:30`, allowedPerformanceTypes: [] }
    ]
    return NextResponse.json({ lives: fallbackLiveData })
  }
}