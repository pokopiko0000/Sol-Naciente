import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

type DateEntry = {
  date: string
  performance_type: '漫才（漫談）' | 'コント' | '未定'
}

type EntryRequest = {
  indies_name: string
  entry_name: string
  entries: DateEntry[]
  remarks: string
  email: string
  lineUrl: string
}

export async function POST(request: NextRequest) {
  let data: EntryRequest | null = null
  try {
    data = await request.json()
    
    // データの存在チェック
    if (!data) {
      return NextResponse.json(
        { error: 'リクエストデータが無効です' },
        { status: 400 }
      )
    }
    
    // 開発環境での時間制限無効化
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.DISABLE_TIME_RESTRICTION === 'true'
    
    if (!isTestMode) {
      // 設定ベースの時間制限チェック
      const settings = await prisma.settings.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (!settings || !settings.is_entry_active) {
        return NextResponse.json(
          { error: 'エントリー受付時間外です' },
          { status: 400 }
        )
      }

      const now = new Date()
      const entryStart = new Date(settings.entry_start_time)
      const entryEnd = new Date(settings.entry_end_time)

      if (now < entryStart || now > entryEnd) {
        return NextResponse.json(
          { error: 'エントリー受付時間外です' },
          { status: 400 }
        )
      }
    }
    
    // バリデーション
    if (!data.indies_name || !data.entry_name || !data.email) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }
    
    if (!data.entries || data.entries.length === 0) {
      return NextResponse.json(
        { error: 'エントリー日を1つ以上選択してください' },
        { status: 400 }
      )
    }
    
    // 複数のエントリーレコードを作成（日付・演目の組み合わせごと）
    const createdEntries = await Promise.all(
      data.entries.map(async (entry) => {
        return await prisma.entry.create({
          data: {
            indies_name: data.indies_name,
            entry_name: data.entry_name,
            performance_type: entry.performance_type,
            target_date: new Date(entry.date),
            remarks: data.remarks || null,
            email: data.email,
            lineUrl: data.lineUrl || null,
          },
        })
      })
    )
    
    return NextResponse.json({ 
      success: true, 
      entries: createdEntries.map(e => ({ id: e.id, date: e.target_date, performance_type: e.performance_type }))
    })
  } catch (error) {
    console.error('Entry creation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      data: data
    })
    return NextResponse.json(
      { 
        error: 'エントリーの作成に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}