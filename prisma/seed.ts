import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 仮のライブデータを作成中...')

  // 既存データをクリア
  await prisma.assignment.deleteMany()
  await prisma.live.deleteMany()
  await prisma.entry.deleteMany()

  // 仮の口火ライブデータ（2025年7月）
  const kuchibeData = [
    new Date('2025-07-05'),
    new Date('2025-07-08'),
    new Date('2025-07-10'),
    new Date('2025-07-12'),
    new Date('2025-07-15'),
    new Date('2025-07-17'),
    new Date('2025-07-19'),
    new Date('2025-07-22'),
    new Date('2025-07-24'),
    new Date('2025-07-26'),
    new Date('2025-07-29'),
    new Date('2025-07-31'),
  ]

  console.log('口火ライブを作成中...')
  for (const date of kuchibeData) {
    await prisma.live.create({
      data: {
        date,
        type: 'KUCHIBE',
        capacity: 11, // 固定11組
      },
    })
  }

  // 仮の二足のわらじライブデータ（2025年7月）
  const niwaraData = [
    new Date('2025-07-13'),
    new Date('2025-07-20'),
    new Date('2025-07-27'),
    new Date('2025-07-28'),
  ]

  console.log('二足のわらじライブを作成中...')
  for (const date of niwaraData) {
    await prisma.live.create({
      data: {
        date,
        type: 'NIWARA',
        capacity: 16, // 固定16組
      },
    })
  }

  const totalLives = await prisma.live.count()
  console.log(`✅ 合計 ${totalLives} 件のライブデータを作成しました！`)
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })