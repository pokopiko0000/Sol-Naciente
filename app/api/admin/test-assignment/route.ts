import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { autoAssignEntries } from '@/lib/assignment'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 簡易認証チェック
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Starting test assignment...')
    const { liveType = 'KUCHIBE' } = await request.json()
    console.log('📝 Live type:', liveType)

    // 既存のテストエントリーに関連するアサインメントを先に削除
    console.log('🗑️ Deleting existing test assignments...')
    const existingTestEntries = await prisma.entry.findMany({
      where: {
        email: {
          contains: '@test.com'
        }
      },
      select: { id: true }
    })
    
    if (existingTestEntries.length > 0) {
      const testEntryIds = existingTestEntries.map(e => e.id)
      const deletedAssignments = await prisma.assignment.deleteMany({
        where: {
          entryId: {
            in: testEntryIds
          }
        }
      })
      console.log(`✅ Deleted ${deletedAssignments.count} test assignments`)
    }
    
    // 既存のテストエントリーをクリア
    console.log('🗑️ Deleting existing test entries...')
    const deleted = await prisma.entry.deleteMany({
      where: {
        email: {
          contains: '@test.com'
        }
      }
    })
    console.log(`✅ Deleted ${deleted.count} test entries`)

    // テスト用のライブ日程
    const liveDates = [
      '7月5日(土)',   // ライブ1
      '7月8日(火)',   // ライブ2
      '7月10日(木)',  // ライブ3
    ]

    // テストシナリオを作成
    const testScenarios = [
      // シナリオ1: 第1希望で全員配置可能なケース（10組）
      { name: 'お笑いA', rep: '田中太郎', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いB', rep: '佐藤花子', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いC', rep: '鈴木一郎', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いD', rep: '高橋美咲', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いE', rep: '伊藤健太', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いF', rep: '渡辺由美', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いG', rep: '山本浩二', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いH', rep: '中村愛', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いI', rep: '小林大輔', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いJ', rep: '加藤真理', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },

      // シナリオ2: 定員オーバーで補欠になるケース（12組目、13組目）
      { name: 'お笑いK', rep: '吉田和也', pref: [liveDates[0]], expectedLive: 0, expectedResult: 'assigned' },
      { name: 'お笑いL', rep: '山田麻衣', pref: [liveDates[0]], expectedLive: -1, expectedResult: 'waiting' },
      { name: 'お笑いM', rep: '松本隆', pref: [liveDates[0]], expectedLive: -1, expectedResult: 'waiting' },

      // シナリオ3: 第2希望で配置されるケース
      { name: 'お笑いN', rep: '井上美穂', pref: [liveDates[0], liveDates[1]], expectedLive: 1, expectedResult: 'assigned' },
      { name: 'お笑いO', rep: '木村拓也', pref: [liveDates[0], liveDates[1]], expectedLive: 1, expectedResult: 'assigned' },

      // シナリオ4: 同一名義制限（月1回まで）
      { name: 'お笑いA', rep: '別の代表者', pref: [liveDates[1]], expectedLive: -1, expectedResult: 'waiting' }, // 既に出演済み

      // シナリオ5: 同一代表者制限（月2回まで）
      { name: 'お笑いP', rep: '田中太郎', pref: [liveDates[1]], expectedLive: 1, expectedResult: 'assigned' }, // 1人目OK
      { name: 'お笑いQ', rep: '田中太郎', pref: [liveDates[2]], expectedLive: -1, expectedResult: 'waiting' }, // 3人目NG

      // シナリオ6: 2つエントリー
      { 
        name: 'お笑いR', rep: '林綾子', pref: [liveDates[1]], expectedLive: 1, expectedResult: 'assigned',
        name2: 'お笑いS', rep2: '森田剛', pref2: [liveDates[2]], expectedLive2: 2, expectedResult2: 'assigned'
      },
    ]

    // テストエントリーを作成
    let entryIndex = 0
    const testEntries: any[] = []
    
    for (const scenario of testScenarios) {
      const entry: any = {
        entryNumber: scenario.name2 ? 2 : 1,
        name1: scenario.name,
        representative1: scenario.rep,
        preference1_1: scenario.pref[0],
        preference1_2: scenario.pref[1] || null,
        preference1_3: scenario.pref[2] || null,
        name2: scenario.name2 || null,
        representative2: scenario.rep2 || null,
        preference2_1: scenario.pref2?.[0] || null,
        preference2_2: scenario.pref2?.[1] || null,
        preference2_3: scenario.pref2?.[2] || null,
        email: `test${++entryIndex}@test.com`,
        lineUrl: null,
        liveType,
        createdAt: new Date(Date.now() - (testEntries.length * 60000)) // createdAtを使用
      }
      testEntries.push({ ...entry, expected: scenario })
    }

    // エントリーを作成
    console.log(`📝 Creating ${testEntries.length} test entries...`)
    const createdEntries = await prisma.$transaction(
      testEntries.map(({ expected, ...entry }) => prisma.entry.create({ data: entry }))
    )
    console.log(`✅ Created ${createdEntries.length} entries`)

    // 自動振り分けを実行
    console.log('🎯 Running auto assignment...')
    const result = await autoAssignEntries(liveType)
    console.log(`✅ Assignment complete: ${result.assignments.length} assigned, ${result.waitingList.length} waiting`)

    // 結果を検証
    const verificationResults = []
    
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i]
      const entry = createdEntries[i]
      
      // 名義1の結果確認
      const assignment1 = result.assignments.find(a => 
        a.entryId === entry.id && a.nameIndex === 1
      )
      const isAssigned1 = !!assignment1
      const assignedLiveIndex1 = assignment1 ? 
        liveDates.findIndex(date => date === scenario.pref[0] || date === scenario.pref[1] || date === scenario.pref[2]) : -1
      
      const verification1 = {
        name: scenario.name,
        representative: scenario.rep,
        preferences: scenario.pref,
        expected: {
          result: scenario.expectedResult,
          liveIndex: scenario.expectedLive
        },
        actual: {
          result: isAssigned1 ? 'assigned' : 'waiting',
          liveIndex: assignedLiveIndex1
        },
        success: (isAssigned1 ? 'assigned' : 'waiting') === scenario.expectedResult
      }
      verificationResults.push(verification1)

      // 名義2の結果確認（ある場合）
      if (scenario.name2) {
        const assignment2 = result.assignments.find(a => 
          a.entryId === entry.id && a.nameIndex === 2
        )
        const isAssigned2 = !!assignment2
        const assignedLiveIndex2 = assignment2 ? 
          liveDates.findIndex(date => date === scenario.pref2[0] || date === scenario.pref2[1]) : -1
        
        const verification2 = {
          name: scenario.name2,
          representative: scenario.rep2,
          preferences: scenario.pref2,
          expected: {
            result: scenario.expectedResult2,
            liveIndex: scenario.expectedLive2
          },
          actual: {
            result: isAssigned2 ? 'assigned' : 'waiting',
            liveIndex: assignedLiveIndex2
          },
          success: (isAssigned2 ? 'assigned' : 'waiting') === scenario.expectedResult2
        }
        verificationResults.push(verification2)
      }
    }

    // ライブごとの配置数を集計
    const liveStats = liveDates.map((date, index) => {
      const count = result.assignments.filter(a => {
        const live = createdEntries.find(e => e.id === a.entryId)
        return live && (
          live.preference1_1 === date || 
          live.preference1_2 === date || 
          live.preference1_3 === date ||
          live.preference2_1 === date ||
          live.preference2_2 === date ||
          live.preference2_3 === date
        )
      }).length
      
      return {
        date,
        assigned: count,
        capacity: 11,
        status: count === 11 ? '満員' : `空き${11 - count}枠`
      }
    })

    const successCount = verificationResults.filter(v => v.success).length
    const totalCount = verificationResults.length

    return NextResponse.json({
      success: true,
      summary: {
        totalTests: totalCount,
        passed: successCount,
        failed: totalCount - successCount,
        successRate: `${Math.round(successCount / totalCount * 100)}%`
      },
      liveStats,
      details: verificationResults,
      assignmentStats: {
        totalAssigned: result.assignments.length,
        totalWaiting: result.waitingList.length
      }
    })

  } catch (error) {
    console.error('Test assignment error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'テスト振り分けに失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}