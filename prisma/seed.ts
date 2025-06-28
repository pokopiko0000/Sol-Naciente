import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 日の出寄席のライブデータを作成中...')

  // 既存データをクリア
  await prisma.assignment.deleteMany()
  await prisma.live.deleteMany()
  await prisma.entry.deleteMany()
  await prisma.settings.deleteMany()

  // 日の出寄席のライブデータ（月6回開催）
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  const hinodeData = [
    new Date(currentYear, currentMonth, 5, 19, 0),   // 5日 19:00
    new Date(currentYear, currentMonth, 9, 19, 30),  // 9日 19:30
    new Date(currentYear, currentMonth, 12, 20, 0),  // 12日 20:00
    new Date(currentYear, currentMonth, 16, 19, 0),  // 16日 19:00
    new Date(currentYear, currentMonth, 19, 19, 30), // 19日 19:30
    new Date(currentYear, currentMonth, 23, 20, 0),  // 23日 20:00
  ]

  console.log('日の出寄席ライブを作成中...')
  for (const date of hinodeData) {
    await prisma.live.create({
      data: {
        date,
        capacity: 24, // 24組固定
        is_confirmed: false
      },
    })
  }

  // デフォルト設定を作成
  const nextMonth = new Date(currentYear, currentMonth + 1, 1)
  await prisma.settings.create({
    data: {
      entry_start_time: new Date(currentYear, currentMonth, 1, 22, 0), // 1日22:00開始
      entry_end_time: new Date(currentYear, currentMonth, 2, 22, 30), // 2日22:30終了
      is_entry_active: false,
      target_year: nextMonth.getFullYear(),
      target_month: nextMonth.getMonth() + 1
    }
  })

  const totalLives = await prisma.live.count()
  console.log(`✅ 合計 ${totalLives} 件の日の出寄席ライブデータを作成しました！`)
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })