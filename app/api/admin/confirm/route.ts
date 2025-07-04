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

    const { liveId } = await request.json()

    if (!liveId) {
      return NextResponse.json(
        { error: 'liveId is required' },
        { status: 400 }
      )
    }

    console.log('🔒 香盤表確定処理を開始 for live:', liveId)

    // 指定されたライブの香盤表を確定
    const updatedLive = await prisma.live.update({
      where: {
        id: liveId
      },
      data: {
        is_confirmed: true
      }
    })

    console.log('✅ 香盤表が確定されました:', updatedLive.id)

    return NextResponse.json({
      success: true,
      message: '香盤表が確定されました',
      live: updatedLive
    })

  } catch (error) {
    console.error('Confirm error:', error)
    return NextResponse.json(
      { 
        error: '香盤表の確定に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}