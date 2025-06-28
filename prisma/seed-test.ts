import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding test data for 日の出寄席...')
  
  // 既存のデータをクリア
  await prisma.assignment.deleteMany()
  await prisma.live.deleteMany()
  await prisma.entry.deleteMany()
  await prisma.settings.deleteMany()
  
  // 日の出寄席のライブテストデータ（月6回開催）
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  const liveEvents = [
    { date: new Date(currentYear, currentMonth, 5, 19, 0), day: '5日(土)' },
    { date: new Date(currentYear, currentMonth, 9, 19, 30), day: '9日(水)' },
    { date: new Date(currentYear, currentMonth, 12, 20, 0), day: '12日(土)' },
    { date: new Date(currentYear, currentMonth, 16, 19, 0), day: '16日(水)' },
    { date: new Date(currentYear, currentMonth, 19, 19, 30), day: '19日(土)' },
    { date: new Date(currentYear, currentMonth, 23, 20, 0), day: '23日(水)' }
  ]
  
  // ライブイベントを作成（日の出寄席は24組定員）
  for (const event of liveEvents) {
    await prisma.live.create({
      data: {
        date: event.date,
        capacity: 24,
        is_confirmed: false
      }
    })
    console.log(`Created 日の出寄席 live event: ${event.day}`)
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
  console.log('Created default settings')
  
  console.log('Test seeding completed!')
  console.log(`Created ${liveEvents.length} 日の出寄席 live events`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })