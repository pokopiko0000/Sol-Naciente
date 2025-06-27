import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 簡易認証チェック
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resetType, liveType } = await request.json()
    
    console.log(`🗑️ Starting reset: ${resetType} for ${liveType || 'all'}`)

    if (resetType === 'entries') {
      // エントリーをリセット（関連するアサインメントも自動的に削除される）
      let deleteCount = 0
      
      // まず関連するアサインメントを削除
      if (liveType && liveType !== 'ALL') {
        // 特定のライブタイプのエントリーに関連するアサインメントを削除
        const entriesToDelete = await prisma.entry.findMany({
          where: { liveType },
          select: { id: true }
        })
        
        if (entriesToDelete.length > 0) {
          const entryIds = entriesToDelete.map(e => e.id)
          await prisma.assignment.deleteMany({
            where: {
              entryId: { in: entryIds }
            }
          })
        }
        
        // エントリーを削除
        const result = await prisma.entry.deleteMany({
          where: { liveType }
        })
        deleteCount = result.count
      } else {
        // すべてのアサインメントを削除
        await prisma.assignment.deleteMany({})
        
        // すべてのエントリーを削除
        const result = await prisma.entry.deleteMany({})
        deleteCount = result.count
      }
      
      console.log(`✅ Deleted ${deleteCount} entries`)
      
      return NextResponse.json({
        success: true,
        message: `${deleteCount}件のエントリーを削除しました`,
        deletedCount: deleteCount
      })
      
    } else if (resetType === 'assignments') {
      // 香盤表（アサインメント）をリセット
      let deleteCount = 0
      
      if (liveType && liveType !== 'ALL') {
        // 特定のライブタイプのアサインメントを削除
        const result = await prisma.assignment.deleteMany({
          where: {
            live: {
              type: liveType
            }
          }
        })
        deleteCount = result.count
      } else {
        // すべてのアサインメントを削除
        const result = await prisma.assignment.deleteMany({})
        deleteCount = result.count
      }
      
      console.log(`✅ Deleted ${deleteCount} assignments`)
      
      return NextResponse.json({
        success: true,
        message: `${deleteCount}件の振り分けを削除しました`,
        deletedCount: deleteCount
      })
      
    } else {
      return NextResponse.json(
        { error: '無効なリセットタイプです' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json(
      { 
        error: 'リセットに失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}