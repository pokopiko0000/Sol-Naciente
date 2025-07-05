import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const liveId = searchParams.get('id')

    if (!liveId) {
      return NextResponse.json({ error: 'Live ID is required' }, { status: 400 })
    }

    // まず、このライブにアサインメントがあるかチェック
    const assignmentCount = await prisma.assignment.count({
      where: { liveId }
    })

    if (assignmentCount > 0) {
      return NextResponse.json(
        { error: 'このライブには出演者が割り当てられているため削除できません' }, 
        { status: 400 }
      )
    }

    // ライブを削除
    await prisma.live.delete({
      where: { id: liveId }
    })

    return NextResponse.json({ message: 'ライブが削除されました' })
  } catch (error) {
    console.error('Live deletion error:', error)
    return NextResponse.json(
      { error: 'ライブの削除に失敗しました' },
      { status: 500 }
    )
  }
}