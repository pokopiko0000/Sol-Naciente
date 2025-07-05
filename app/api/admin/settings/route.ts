import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// 設定を取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const auth = request.headers.get('Authorization')
    if (!auth || auth !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 最新の設定を取得
    const settings = await prisma.settings.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// 設定を更新
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const auth = request.headers.get('Authorization')
    if (!auth || auth !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // バリデーション
    if (!data.entry_start_time || !data.entry_end_time) {
      return NextResponse.json(
        { error: '開始時間と終了時間は必須です' },
        { status: 400 }
      )
    }

    if (!data.target_year || !data.target_month) {
      return NextResponse.json(
        { error: '募集対象年月は必須です' },
        { status: 400 }
      )
    }

    // 既存の設定を削除して新しい設定を作成
    await prisma.settings.deleteMany({})
    
    const settings = await prisma.settings.create({
      data: {
        entry_start_time: new Date(data.entry_start_time),
        entry_end_time: new Date(data.entry_end_time),
        is_entry_active: data.is_entry_active || false,
        target_year: data.target_year,
        target_month: data.target_month,
        recruitment_text: data.recruitment_text || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      settings 
    })
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// 募集要項テキストのみ更新
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const auth = request.headers.get('Authorization')
    if (!auth || auth !== 'Bearer owarai2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // 既存の設定を取得
    const existingSettings = await prisma.settings.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 既存の設定を削除して新しい設定を作成（recruitment_textのみ更新）
    await prisma.settings.deleteMany({})
    
    const settings = await prisma.settings.create({
      data: {
        entry_start_time: existingSettings?.entry_start_time || new Date(),
        entry_end_time: existingSettings?.entry_end_time || new Date(),
        is_entry_active: existingSettings?.is_entry_active || false,
        target_year: existingSettings?.target_year || new Date().getFullYear(),
        target_month: existingSettings?.target_month || new Date().getMonth() + 1,
        recruitment_text: data.recruitment_text || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      settings 
    })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update recruitment text' },
      { status: 500 }
    )
  }
}