import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 簡易認証チェック（本番環境では適切な認証システムを使用）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lives = await prisma.live.findMany({
      include: {
        assignments: {
          include: {
            entry: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    return NextResponse.json({ lives })
  } catch (error) {
    console.error('Failed to fetch lives:', error)
    return NextResponse.json({ lives: [] }, { status: 500 })
  }
}