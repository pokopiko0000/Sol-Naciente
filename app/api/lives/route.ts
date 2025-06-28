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
    
    // 日の出寄席のライブデータを取得（ライブタイプは削除済み）
    const lives = await prisma.live.findMany({
      where: {
        date: {
          gte: targetMonthStart,
          lte: targetMonthEnd
        }
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    console.log(`Lives API - Found ${lives.length} lives for 日の出寄席`)
    lives.forEach(live => {
      console.log(`  - ${live.date.toISOString()}`)
    })
    
    const dates = lives.map(live => {
      const dateStr = live.date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }).replace(`${targetYear}年`, '')
      
      // 開始・終了時間を追加（日の出寄席は1時間半固定）
      const startTime = live.date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const duration = 90 // 1時間半
      const endDate = new Date(live.date.getTime() + duration * 60 * 1000)
      const endTime = endDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      return `${dateStr} ${startTime}〜${endTime}`
    })
    
    // フォールバック用のテストデータ（月6回開催）
    console.log('Lives API - Formatted dates:', dates)
    if (dates.length === 0) {
      console.log('Lives API - No data found, using fallback for 日の出寄席')
      
      // 月6回のサンプル日程を生成（1時間半固定）
      const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString('ja-JP', { month: 'long' })
      const fallbackDates = [
        `${monthName}5日(火) 19:00〜20:30`,
        `${monthName}9日(土) 19:30〜21:00`,
        `${monthName}12日(火) 20:00〜21:30`,
        `${monthName}16日(土) 19:00〜20:30`,
        `${monthName}19日(火) 19:30〜21:00`,
        `${monthName}23日(土) 20:00〜21:30`
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
    
    // エラー時もフォールバックデータを返す（月6回開催）
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const targetMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const targetYear = currentMonth === 12 ? now.getFullYear() + 1 : now.getFullYear()
    const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleDateString('ja-JP', { month: 'long' })
    
    const fallbackDates = [
      `${monthName}5日(火) 19:00〜20:30`,
      `${monthName}9日(土) 19:30〜21:00`,
      `${monthName}12日(火) 20:00〜21:30`,
      `${monthName}16日(土) 19:00〜20:30`,
      `${monthName}19日(火) 19:30〜21:00`,
      `${monthName}23日(土) 20:00〜21:30`
    ]
    return NextResponse.json({ dates: fallbackDates })
  }
}