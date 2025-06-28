import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    // 簡易認証チェック
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { liveId, assignmentId, newOrder } = await request.json()

    if (!liveId || !assignmentId || newOrder === undefined) {
      return NextResponse.json(
        { error: 'liveId, assignmentId, newOrder are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating assignment order: ${assignmentId} to order ${newOrder}`)

    // アサインメントの順序を更新
    const updatedAssignment = await prisma.assignment.update({
      where: {
        id: assignmentId,
        liveId: liveId
      },
      data: {
        order: newOrder
      }
    })

    console.log('✅ Assignment order updated successfully')

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment
    })

  } catch (error) {
    console.error('Assignment order update error:', error)
    return NextResponse.json(
      { 
        error: '順序の更新に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}