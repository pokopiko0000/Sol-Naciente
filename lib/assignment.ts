import { prisma } from '@/lib/db'
import { Entry, Live } from '@prisma/client'

type AssignmentResult = {
  assignments: {
    entryId: string
    liveId: string
    order: number
  }[]
  waitingList: string[]
}

export async function autoAssignEntries(): Promise<AssignmentResult> {
  console.log('🔍 Starting assignment for 日の出寄席')
  
  // デバッグ用：環境変数を確認
  console.log('📍 NODE_ENV:', process.env.NODE_ENV)
  console.log('📍 DISABLE_TIME_RESTRICTION:', process.env.DISABLE_TIME_RESTRICTION)
  
  // 時間制限の無効化判定（開発・テスト用）
  const disableTimeRestriction = process.env.NODE_ENV === 'development' || 
                                process.env.NODE_ENV === 'test' || 
                                process.env.DISABLE_TIME_RESTRICTION === 'true'
  
  console.log('⏰ Time restriction disabled:', disableTimeRestriction)
  
  const whereClause: any = {}
  
  // 設定ベースの時間制限を適用
  if (!disableTimeRestriction) {
    const settings = await prisma.settings.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!settings || !settings.is_entry_active) {
      console.log('⏰ Entry not active or no settings found')
      return { assignments: [], waitingList: [] }
    }

    const entryStart = new Date(settings.entry_start_time)
    const entryEnd = new Date(settings.entry_end_time)
    
    console.log('⏰ Time restriction applied:', entryStart, 'to', entryEnd)
    whereClause.createdAt = {
      gte: entryStart,
      lte: entryEnd
    }
  } else {
    console.log('⏰ No time restriction - fetching all entries')
  }
  
  console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2))
  
  // エントリーを受付時刻順で取得
  const entries = await prisma.entry.findMany({
    where: whereClause,
    orderBy: {
      timestamp: 'asc' // 先着順
    }
  })

  // 利用可能なライブを取得（日の出寄席のみ、ライブタイプなし）
  const lives = await prisma.live.findMany({
    where: {
      date: {
        gte: new Date()
      }
    },
    include: {
      assignments: true
    },
    orderBy: {
      date: 'asc'
    }
  })
  
  console.log('📊 Found entries:', entries.length)
  console.log('🎭 Found lives:', lives.length)
  
  // デバッグ：全エントリーを表示
  entries.forEach(entry => {
    console.log('📝 Entry:', {
      id: entry.id,
      indies_name: entry.indies_name,
      entry_name: entry.entry_name,
      target_date: entry.target_date,
      performance_type: entry.performance_type,
      timestamp: entry.timestamp || entry.createdAt
    })
  })
  
  // デバッグ：ライブ日程を表示
  lives.forEach(live => {
    console.log('📅 Live:', {
      id: live.id,
      date: live.date,
      capacity: live.capacity,
      currentAssignments: live.assignments.length
    })
  })

  const result: AssignmentResult = {
    assignments: [],
    waitingList: []
  }

  // 各ライブの現在の配置数を追跡
  const assignedPerLive = new Map<string, number>()
  lives.forEach(live => {
    assignedPerLive.set(live.id, live.assignments.length)
  })

  // シンプルな先着順処理
  for (const entry of entries) {
    console.log('🎪 Processing entry:', entry.entry_name, 'target_date:', entry.target_date)
    
    // エントリー対象日に該当するライブを検索
    const targetLive = lives.find(live => {
      const liveDate = live.date.toDateString()
      const entryDate = new Date(entry.target_date).toDateString()
      return liveDate === entryDate
    })

    if (!targetLive) {
      console.log('❌ No matching live found for date:', entry.target_date)
      result.waitingList.push(entry.id)
      continue
    }

    const currentCount = assignedPerLive.get(targetLive.id) || 0
    const capacity = targetLive.capacity || 24 // デフォルト24組

    if (currentCount < capacity) {
      // 配置可能（順序は後でランダムに決定）
      result.assignments.push({
        entryId: entry.id,
        liveId: targetLive.id,
        order: 0 // 一時的に0を設定
      })
      assignedPerLive.set(targetLive.id, currentCount + 1)
      console.log('✅ Assigned:', entry.entry_name, 'to live', targetLive.id)
    } else {
      // 定員オーバー
      result.waitingList.push(entry.id)
      console.log('❌ Capacity full for live', targetLive.id, 'adding to waiting list:', entry.entry_name)
    }
  }

  // 各ライブごとにランダムな順序を付与
  const liveGroups = new Map<string, typeof result.assignments>()
  
  // ライブごとにグループ化
  for (const assignment of result.assignments) {
    if (!liveGroups.has(assignment.liveId)) {
      liveGroups.set(assignment.liveId, [])
    }
    liveGroups.get(assignment.liveId)!.push(assignment)
  }
  
  // 各ライブのアサインメントをシャッフルして順序を付与
  const finalAssignments: typeof result.assignments = []
  
  for (const [liveId, assignments] of liveGroups) {
    // Fisher-Yatesアルゴリズムでシャッフル
    const shuffled = [...assignments]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    // 順序を付与
    shuffled.forEach((assignment, index) => {
      assignment.order = index + 1
      finalAssignments.push(assignment)
    })
    
    console.log(`🎲 Live ${liveId}: ${shuffled.length}組をランダム順序で配置`)
  }

  console.log('📋 Final assignments:', finalAssignments.length)
  console.log('⏳ Waiting list:', result.waitingList.length)
  
  return {
    assignments: finalAssignments,
    waitingList: result.waitingList
  }
}