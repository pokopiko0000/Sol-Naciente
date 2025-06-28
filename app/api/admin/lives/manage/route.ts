import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ライブ日程の作成
export async function POST(request: NextRequest) {
  try {
    // 簡易認証チェック
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date, type, capacity } = await request.json()
    
    // 日付をDateオブジェクトに変換
    const liveDate = new Date(date)
    
    // 同じ日付・タイプのライブが既に存在するかチェック
    const existing = await prisma.live.findFirst({
      where: {
        date: liveDate,
        type
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: '同じ日付のライブが既に存在します' },
        { status: 400 }
      )
    }
    
    // ライブを作成
    const live = await prisma.live.create({
      data: {
        date: liveDate,
        type,
        capacity: capacity || (type === 'KUCHIBE' ? 11 : 16)
      }
    })
    
    return NextResponse.json({
      success: true,
      live
    })
    
  } catch (error) {
    console.error('Live creation error:', error)
    return NextResponse.json(
      { 
        error: 'ライブの作成に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// ライブ日程の削除
export async function DELETE(request: NextRequest) {
  try {
    // 簡易認証チェック
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { liveId } = await request.json()
    
    // 関連するアサインメントをチェック
    const assignments = await prisma.assignment.findMany({
      where: { liveId }
    })
    
    if (assignments.length > 0) {
      return NextResponse.json(
        { error: '既に振り分けが存在するライブは削除できません' },
        { status: 400 }
      )
    }
    
    // ライブを削除
    await prisma.live.delete({
      where: { id: liveId }
    })
    
    return NextResponse.json({
      success: true,
      message: 'ライブを削除しました'
    })
    
  } catch (error) {
    console.error('Live deletion error:', error)
    return NextResponse.json(
      { 
        error: 'ライブの削除に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}