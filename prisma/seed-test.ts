import { PrismaClient, LiveType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding test data for July 2025...')
  
  // 既存のデータをクリア
  await prisma.assignment.deleteMany()
  await prisma.live.deleteMany()
  await prisma.entry.deleteMany()
  
  // 2025年7月の口火ライブテストデータ
  const liveEvents = [
    { date: new Date('2025-07-05T20:00:00'), day: '7月5日(土)' },
    { date: new Date('2025-07-08T20:00:00'), day: '7月8日(火)' },
    { date: new Date('2025-07-10T20:00:00'), day: '7月10日(木)' },
    { date: new Date('2025-07-12T20:00:00'), day: '7月12日(土)' },
    { date: new Date('2025-07-15T20:00:00'), day: '7月15日(火)' },
    { date: new Date('2025-07-17T20:00:00'), day: '7月17日(木)' },
    { date: new Date('2025-07-19T20:00:00'), day: '7月19日(土)' },
    { date: new Date('2025-07-22T20:00:00'), day: '7月22日(火)' },
    { date: new Date('2025-07-24T20:00:00'), day: '7月24日(木)' },
    { date: new Date('2025-07-26T20:00:00'), day: '7月26日(土)' }
  ]
  
  // ライブイベントを作成
  for (const event of liveEvents) {
    await prisma.live.create({
      data: {
        date: event.date,
        type: LiveType.KUCHIBE,
        capacity: 10
      }
    })
    console.log(`Created live event: ${event.day}`)
  }
  
  console.log('Test seeding completed!')
  console.log(`Created ${liveEvents.length} KUCHIBE live events for July 2025`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })