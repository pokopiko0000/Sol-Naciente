import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // ここで交番表確定の処理を実装
    // 例: メール送信、ステータス更新など
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to confirm schedule:', error)
    return NextResponse.json(
      { error: '確定に失敗しました' },
      { status: 500 }
    )
  }
}