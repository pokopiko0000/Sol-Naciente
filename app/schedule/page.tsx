'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

// 終了時刻を計算（日の出寄席は1時間半）
function calculateEndTime(startDateTime: string) {
  const startDate = new Date(startDateTime)
  const duration = 90 // 1時間半
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000)
  return endDate
}

// 開始時刻と終了時刻の表示用文字列を生成
function formatTimeRange(startDateTime: string) {
  const startDate = new Date(startDateTime)
  const endDate = calculateEndTime(startDateTime)
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    })
  }
  
  return `${formatTime(startDate)}〜${formatTime(endDate)}`
}

type Assignment = {
  id: string
  order: number
  entry: {
    indies_name: string
    entry_name: string
    performance_type: string
  }
}

type Live = {
  id: string
  date: string
  capacity: number
  is_confirmed: boolean
  assignments: Assignment[]
}

export default function SchedulePage() {
  const [lives, setLives] = useState<Live[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const response = await fetch('/api/schedule')
        const data = await response.json()
        setLives(data.lives || [])
      } catch (error) {
        console.error('Failed to fetch schedule:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            日の出寄席 香盤表
          </h1>
          <p className="text-xl text-gray-600">出演スケジュール</p>
        </div>

        {lives.filter(live => live.is_confirmed).length === 0 ? (
          <div className="text-center">
            <div className="glass-card max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                まだ香盤表が公開されていません
              </h2>
              <p className="text-gray-600 mb-6">
                香盤表は振り分け完了後に公開されます。<br />
                しばらくお待ちください。
              </p>
              <a
                href="/"
                className="inline-block px-8 py-3 bg-gray-900 text-white rounded-md font-semibold hover:bg-black transition-colors"
              >
                エントリーページに戻る
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {lives.filter(live => live.is_confirmed).map((live) => {
              const startTime = new Date(live.date)
              const endTime = new Date(startTime.getTime() + 90 * 60 * 1000)
              
              return (
                <div key={live.id} className="glass-card">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {startTime.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </h2>
                    <p className="text-xl text-gray-700 mb-1">
                      {startTime.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} 〜 {endTime.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      出演者: {live.assignments.length}組 / 定員: {live.capacity}組
                    </p>
                  </div>

                {live.assignments.length > 0 ? (
                  <div className="space-y-3">
                    {live.assignments
                      .sort((a, b) => a.order - b.order)
                      .map((assignment) => (
                      <div 
                        key={assignment.id} 
                        className="flex items-center p-4 bg-white/50 rounded-lg border border-gray-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                          {assignment.order}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">
                            {assignment.entry.entry_name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {assignment.entry.indies_name}
                          </p>
                          <p className="text-blue-600 text-sm font-medium">
                            {assignment.entry.performance_type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    まだ出演者が決定していません
                  </p>
                )}
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-md font-semibold hover:bg-black transition-colors"
          >
            エントリーページに戻る
          </a>
        </div>
      </div>
    </div>
  )
}