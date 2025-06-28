import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 最新の設定を取得
    const settings = await prisma.settings.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Entry status GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entry status' },
      { status: 500 }
    )
  }
}