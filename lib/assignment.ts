import { prisma } from '@/lib/db'
import { Entry, Live, LiveType } from '@prisma/client'

type AssignmentResult = {
  assignments: {
    entryId: string
    liveId: string
    nameIndex: number
    order: number
  }[]
  waitingList: string[]
}

export async function autoAssignEntries(liveType: LiveType): Promise<AssignmentResult> {
  console.log('🔍 Starting assignment for liveType:', liveType)
  
  // デバッグ用：環境変数を確認
  console.log('📍 NODE_ENV:', process.env.NODE_ENV)
  console.log('📍 DISABLE_TIME_RESTRICTION:', process.env.DISABLE_TIME_RESTRICTION)
  
  // Check if time restrictions should be disabled (for testing/development)
  const disableTimeRestriction = process.env.NODE_ENV === 'development' || 
                                process.env.NODE_ENV === 'test' || 
                                process.env.DISABLE_TIME_RESTRICTION === 'true'
  
  console.log('⏰ Time restriction disabled:', disableTimeRestriction)
  
  const whereClause: any = {
    liveType
  }
  
  // Only apply time restrictions in production environment
  if (!disableTimeRestriction) {
    const timeStart = new Date(new Date().setHours(22, 0, 0, 0))
    const timeEnd = new Date(new Date().setHours(22, 30, 0, 0))
    console.log('⏰ Time restriction applied:', timeStart, 'to', timeEnd)
    whereClause.createdAt = {
      gte: timeStart,
      lt: timeEnd
    }
  } else {
    console.log('⏰ No time restriction - fetching all entries')
  }
  
  console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2))
  
  const entries = await prisma.entry.findMany({
    where: whereClause,
    orderBy: {
      timestamp: 'asc'
    }
  })

  const lives = await prisma.live.findMany({
    where: {
      type: liveType,
      date: {
        gte: new Date()
      }
    },
    include: {
      assignments: true
    }
  })
  
  console.log('📊 Found entries:', entries.length)
  console.log('🎭 Found lives:', lives.length)
  
  
  // Debug: Show all entries
  entries.forEach(entry => {
    console.log('📝 Entry:', {
      id: entry.id,
      name1: entry.name1,
      preferences: [entry.preference1_1, entry.preference1_2, entry.preference1_3].filter(Boolean),
      timestamp: entry.timestamp || entry.createdAt
    })
  })
  
  // Debug: Show live dates format
  lives.forEach(live => {
    const liveDate = live.date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }).replace('2025年', '')
    console.log('📅 Live date formatted:', liveDate, 'from', live.date)
  })

  const result: AssignmentResult = {
    assignments: [],
    waitingList: []
  }

  const capacityMap = new Map<string, number>()
  const assignedPerLive = new Map<string, number>()
  const assignedNames = new Set<string>()
  const assignedRepresentatives = new Map<string, number>()

  lives.forEach(live => {
    const capacity = liveType === 'KUCHIBE' ? 11 : 16
    capacityMap.set(live.id, capacity)
    assignedPerLive.set(live.id, live.assignments.length)
  })

  for (const entry of entries) {
    console.log('🎪 Processing entry:', entry.name1, 'preferences:', [entry.preference1_1, entry.preference1_2, entry.preference1_3].filter(Boolean))
    
    let assigned1 = false
    let assigned2 = false

    const preferences1 = [
      entry.preference1_1,
      entry.preference1_2,
      entry.preference1_3
    ].filter(Boolean)

    for (const pref of preferences1) {
      if (assigned1) break

      const live = lives.find(l => {
        const liveDate = l.date.toLocaleDateString('ja-JP', {
          month: 'long',
          day: 'numeric',
          weekday: 'short'
        }).replace('2025年', '')
        return liveDate === pref
      })

      if (!live) continue

      const currentCount = assignedPerLive.get(live.id) || 0
      const capacity = capacityMap.get(live.id) || 0
      const repCount = assignedRepresentatives.get(entry.representative1) || 0

      if (
        currentCount < capacity &&
        !assignedNames.has(entry.name1) &&
        repCount < 2
      ) {
        result.assignments.push({
          entryId: entry.id,
          liveId: live.id,
          nameIndex: 1,
          order: 0 // 後でランダム順序に置き換える
        })
        assignedPerLive.set(live.id, currentCount + 1)
        assignedNames.add(entry.name1)
        assignedRepresentatives.set(entry.representative1, repCount + 1)
        assigned1 = true
      }
    }

    if (entry.entryNumber === 2 && entry.name2 && entry.representative2) {
      const preferences2 = [
        entry.preference2_1,
        entry.preference2_2,
        entry.preference2_3
      ].filter(Boolean)

      for (const pref of preferences2) {
        if (assigned2) break

        const live = lives.find(l => {
          const liveDate = l.date.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          }).replace('2025年', '')
          return liveDate === pref
        })

        if (!live) continue

        const currentCount = assignedPerLive.get(live.id) || 0
        const capacity = capacityMap.get(live.id) || 0
        const repCount = assignedRepresentatives.get(entry.representative2) || 0

        if (
          currentCount < capacity &&
          !assignedNames.has(entry.name2) &&
          repCount < 2
        ) {
          result.assignments.push({
            entryId: entry.id,
            liveId: live.id,
            nameIndex: 2,
            order: 0 // 後でランダム順序に置き換える
          })
          assignedPerLive.set(live.id, currentCount + 1)
          assignedNames.add(entry.name2)
          assignedRepresentatives.set(entry.representative2, repCount + 1)
          assigned2 = true
        }
      }
    }

    if (!assigned1 && !assigned2) {
      result.waitingList.push(entry.id)
    }
  }

  // 各ライブの配置にランダム順序を付与
  const liveAssignments = new Map<string, typeof result.assignments>()
  
  // ライブ別にアサインメントをグループ化
  for (const assignment of result.assignments) {
    if (!liveAssignments.has(assignment.liveId)) {
      liveAssignments.set(assignment.liveId, [])
    }
    liveAssignments.get(assignment.liveId)!.push(assignment)
  }
  
  // 各ライブのアサインメントをランダムに並び替えて順序を付与
  const finalAssignments: typeof result.assignments = []
  
  for (const [liveId, assignments] of Array.from(liveAssignments)) {
    // Fisher-Yatesアルゴリズムでランダムシャッフル
    const shuffled = [...assignments]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    // 順序を付与
    shuffled.forEach((assignment, index) => {
      finalAssignments.push({
        ...assignment,
        order: index + 1
      })
    })
    
    console.log(`🎲 Live ${liveId}: ${shuffled.length}人をランダム順序で配置`)
  }
  
  result.assignments = finalAssignments
  return result
}