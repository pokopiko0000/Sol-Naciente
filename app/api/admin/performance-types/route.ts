import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const performanceTypes = await prisma.performanceType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ performanceTypes })
  } catch (error) {
    console.error('Performance types GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Performance type name is required' }, { status: 400 })
    }

    // 既存の演目の最大order値を取得
    const maxOrder = await prisma.performanceType.aggregate({
      _max: { order: true }
    })

    const newOrder = (maxOrder._max.order || 0) + 1

    const performanceType = await prisma.performanceType.create({
      data: {
        name: name.trim(),
        order: newOrder
      }
    })

    return NextResponse.json({ performanceType })
  } catch (error: any) {
    console.error('Performance type creation error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'この演目名は既に存在します' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create performance type' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Performance type ID is required' }, { status: 400 })
    }

    await prisma.performanceType.delete({
      where: { id }
    })

    return NextResponse.json({ message: '演目が削除されました' })
  } catch (error) {
    console.error('Performance type deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete performance type' },
      { status: 500 }
    )
  }
}