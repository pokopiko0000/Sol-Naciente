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
    
    // 既存のアサインメントを削除（日の出寄席のみ）
    await prisma.assignment.deleteMany({})
    
    const result = await autoAssignEntries()
    
    // 新しいアサインメントを作成
    await prisma.$transaction(
      result.assignments.map(assignment =>
        prisma.assignment.create({
          data: assignment
        })
      )
    )
    
    return NextResponse.json({
      success: true,
      assignedCount: result.assignments.length,
      waitingCount: result.waitingList.length
    })
  } catch (error) {
    console.error('Assignment error:', error)
    return NextResponse.json(
      { error: '振り分けに失敗しました' },
      { status: 500 }
    )
  }
}