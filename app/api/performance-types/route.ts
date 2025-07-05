import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const performanceTypes = await prisma.performanceType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true
      }
    })

    return NextResponse.json({ performanceTypes })
  } catch (error) {
    console.error('Performance types GET error:', error)
    
    // フォールバック：デフォルト演目を返す
    const defaultTypes = [
      { id: 'default-1', name: '漫才（漫談）', order: 1 },
      { id: 'default-2', name: 'コント', order: 2 },
      { id: 'default-3', name: '未定', order: 3 }
    ]
    
    return NextResponse.json({ performanceTypes: defaultTypes })
  }
}