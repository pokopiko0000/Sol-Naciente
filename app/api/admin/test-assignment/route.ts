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

    console.log('🔍 Starting test assignment for 日の出寄席...')

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

    // テスト用のライブ日程（現在月の日付）
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    const liveDates = [
      new Date(currentYear, currentMonth, 5),   // 5日
      new Date(currentYear, currentMonth, 12),  // 12日
      new Date(currentYear, currentMonth, 19),  // 19日
    ]

    // テストシナリオを作成（日の出寄席の新しい構造）
    const testScenarios = [
      // 先着順で24組まで配置されるテスト
      ...Array.from({ length: 25 }, (_, i) => ({
        indies_name: `テストプロダクション${i + 1}`,
        entry_name: `テストコンビ${i + 1}`,
        performance_type: ['漫才（漫談）', 'コント', '未定'][i % 3],
        target_date: liveDates[0], // 全員同じ日を希望
        expected: i < 24 ? 'assigned' : 'waiting' // 24組まで配置、25組目は待機
      })),
      
      // 別の日程を希望するグループ
      ...Array.from({ length: 10 }, (_, i) => ({
        indies_name: `テストプロダクション${i + 26}`,
        entry_name: `テストコンビ${i + 26}`,
        performance_type: ['漫才（漫談）', 'コント', '未定'][i % 3],
        target_date: liveDates[1], // 2番目の日を希望
        expected: 'assigned' // この日は空いているので全員配置
      }))
    ]

    // テストエントリーを作成
    console.log(`📝 Creating ${testScenarios.length} test entries...`)
    const testEntries = testScenarios.map((scenario, index) => ({
      indies_name: scenario.indies_name,
      entry_name: scenario.entry_name,
      performance_type: scenario.performance_type,
      target_date: scenario.target_date,
      remarks: index % 5 === 0 ? `${scenario.target_date.getDate()}日は出番を早めにしてください` : null,
      email: `test${index + 1}@test.com`,
      lineUrl: index % 3 === 0 ? `https://line.me/ti/p/test${index + 1}` : null,
      timestamp: new Date(Date.now() - ((testScenarios.length - index) * 60000)) // 先着順になるよう時間調整
    }))
    
    const createdEntries = await prisma.$transaction(
      testEntries.map(entry => prisma.entry.create({ data: entry }))
    )
    console.log(`✅ Created ${createdEntries.length} entries`)

    // 自動振り分けを実行
    console.log('🎯 Running auto assignment...')
    const result = await autoAssignEntries()
    console.log(`✅ Assignment complete: ${result.assignments.length} assigned, ${result.waitingList.length} waiting`)

    // 結果を検証
    const verificationResults = []
    
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i]
      const entry = createdEntries[i]
      
      const assignment = result.assignments.find(a => a.entryId === entry.id)
      const isAssigned = !!assignment
      
      const verification = {
        name: scenario.entry_name,
        indies_name: scenario.indies_name,
        target_date: scenario.target_date.toLocaleDateString('ja-JP'),
        expected: scenario.expected,
        actual: isAssigned ? 'assigned' : 'waiting',
        success: (isAssigned ? 'assigned' : 'waiting') === scenario.expected,
        order: assignment?.order || null
      }
      verificationResults.push(verification)
    }

    // ライブごとの配置数を集計
    const liveStats = await Promise.all(liveDates.map(async (date) => {
      const dateStr = date.toDateString()
      const count = result.assignments.filter(a => {
        const entry = createdEntries.find(e => e.id === a.entryId)
        return entry && entry.target_date.toDateString() === dateStr
      }).length
      
      return {
        date: date.toLocaleDateString('ja-JP'),
        assigned: count,
        capacity: 24,
        status: count === 24 ? '満員' : `空き${24 - count}枠`
      }
    }))

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