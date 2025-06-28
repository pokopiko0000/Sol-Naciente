import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 未来の確定済みライブのみを取得
    const lives = await prisma.live.findMany({
      where: {
        date: {
          gte: new Date()
        },
        is_confirmed: true // 確定済みのライブのみ
      },
      include: {
        assignments: {
          include: {
            entry: true
          },
          orderBy: {
            order: 'asc' // 順序でソート
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json({ lives })
  } catch (error) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}