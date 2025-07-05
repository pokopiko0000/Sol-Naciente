'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'

type DateEntry = {
  date: string
  performance_type: string
}

// 時間表示コンポーネント（分離して再レンダリングを防ぐ）
const ClockDisplay = memo(function ClockDisplay({ currentTime, timeUntilClose }: { currentTime: Date | null, timeUntilClose: string }) {
  return (
    <div className="glass-card mb-8 text-center">
      <p className="text-3xl font-bold text-gray-800 mb-2 font-mono">
        {currentTime?.toLocaleTimeString('ja-JP') || '--:--:--'}
      </p>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-gray-900">エントリー受付中</p>
        <p className="text-sm text-gray-600">{timeUntilClose}</p>
      </div>
    </div>
  )
})

// パフォーマンス最適化のための分離コンポーネント
const DateSelectionSection = memo(function DateSelectionSection({ 
  availableLives, 
  formData, 
  performanceTypes,
  onDateToggle, 
  onPerformanceTypeChange 
}: {
  availableLives: any[]
  formData: EntryForm
  performanceTypes: any[]
  onDateToggle: (date: string) => void
  onPerformanceTypeChange: (date: string, performanceType: string) => void
}) {
  if (availableLives.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-lg mb-2">エントリー可能な日程がありません</p>
        <p className="text-gray-400 text-sm">管理者が対象月のライブ日程を設定するまでお待ちください</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {availableLives.map(live => {
        const dateString = live.dateString
        const selectedEntry = formData.entries.find(e => e.date === dateString)
        const isSelected = !!selectedEntry
        
        // このライブで利用可能な演目を取得（空の場合は全ての演目を利用可能）
        const availablePerformanceTypes = live.allowedPerformanceTypes.length > 0 
          ? performanceTypes.filter(type => live.allowedPerformanceTypes.includes(type.id))
          : performanceTypes
        
        return (
          <div key={live.id} className={`border-2 rounded-lg p-4 transition-all ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onDateToggle(dateString)}
                className={`font-medium text-left ${
                  isSelected ? 'text-blue-700' : 'text-gray-700'
                }`}
              >
                {dateString}
              </button>
              
              {isSelected && selectedEntry && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">演目:</span>
                  <select
                    value={selectedEntry.performance_type}
                    onChange={(e) => onPerformanceTypeChange(dateString, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availablePerformanceTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {live.allowedPerformanceTypes.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                対象演目: {availablePerformanceTypes.map(type => type.name).join('、')}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

type EntryForm = {
  indies_name: string
  entry_name: string
  entries: DateEntry[]
  remarks: string
  email: string
  lineUrl: string
}

export default function EntryPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<EntryForm>({
    indies_name: '',
    entry_name: '',
    entries: [],
    remarks: '',
    email: '',
    lineUrl: ''
  })
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEntryOpen, setIsEntryOpen] = useState(false)
  const [availableLives, setAvailableLives] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [timeUntilClose, setTimeUntilClose] = useState('')
  const [mounted, setMounted] = useState(false)
  const [entryPhase, setEntryPhase] = useState<'waiting' | 'accepting' | 'closed'>('waiting')
  const [entrySettings, setEntrySettings] = useState<any>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [lastSettingsUpdate, setLastSettingsUpdate] = useState<number>(0)
  const [performanceTypes, setPerformanceTypes] = useState<any[]>([])
  const [performanceTypesLoaded, setPerformanceTypesLoaded] = useState(false)
  const [recruitmentText, setRecruitmentText] = useState('')

  // 時間表示用のuseEffect（設定に依存しない）
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  // 設定取得用のuseEffect
  useEffect(() => {
    fetchEntrySettings()
    
    // 30秒ごとに設定を再取得
    const settingsTimer = setInterval(() => {
      fetchEntrySettings()
    }, 30000)
    
    return () => clearInterval(settingsTimer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // エントリー日程取得用のuseEffect
  useEffect(() => {
    fetchLiveDates()
  }, [lastSettingsUpdate])

  // 演目取得用のuseEffect
  useEffect(() => {
    fetchPerformanceTypes()
  }, [])

  // 時間判定用のuseEffect
  useEffect(() => {
    if (!currentTime || !settingsLoaded) return

    const checkEntryStatus = () => {
      const now = currentTime
      
      // 設定ベースの時間制限チェック
      const isTestMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_TEST_MODE === 'true'
      
      if (isTestMode) {
        setShowForm(true)
        setEntryPhase('accepting')
        setIsEntryOpen(true)
        setTimeUntilClose('開発環境：受付中')
        return
      }
      
      if (!entrySettings) {
        console.log('No entry settings available')
        setShowForm(false)
        setEntryPhase('waiting')
        setIsEntryOpen(false)
        setTimeUntilClose('設定読み込み中...')
        return
      }
      
      // is_entry_activeのチェック
      if (!entrySettings.is_entry_active) {
        console.log('Entry is not active:', entrySettings)
        setShowForm(false)
        setEntryPhase('waiting')
        setIsEntryOpen(false)
        setTimeUntilClose('エントリー受付停止中')
        return
      }
      
      const entryStart = new Date(entrySettings.entry_start_time)
      const entryEnd = new Date(entrySettings.entry_end_time)
      
      console.log('Entry check:', {
        now: now.toISOString(),
        entryStart: entryStart.toISOString(),
        entryEnd: entryEnd.toISOString(),
        isActive: entrySettings.is_entry_active,
        condition: now >= entryStart && now <= entryEnd
      })
      
      if (now >= entryStart && now <= entryEnd) {
        // エントリー受付中
        setShowForm(true)
        setEntryPhase('accepting')
        setIsEntryOpen(true)
        
        const timeLeft = entryEnd.getTime() - now.getTime()
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
        
        if (hoursLeft > 0) {
          setTimeUntilClose(`残り${hoursLeft}時間${minutesLeft}分`)
        } else {
          setTimeUntilClose(`残り${minutesLeft}分`)
        }
      } else if (now < entryStart) {
        // エントリー開始前
        setShowForm(false)
        setEntryPhase('waiting')
        setIsEntryOpen(false)
        
        const timeUntil = entryStart.getTime() - now.getTime()
        const daysUntil = Math.floor(timeUntil / (1000 * 60 * 60 * 24))
        const hoursUntil = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60))
        
        if (daysUntil > 0) {
          setTimeUntilClose(`エントリー開始まで${daysUntil}日${hoursUntil}時間`)
        } else if (hoursUntil > 0) {
          setTimeUntilClose(`エントリー開始まで${hoursUntil}時間${minutesUntil}分`)
        } else {
          setTimeUntilClose(`エントリー開始まで${minutesUntil}分`)
        }
      } else {
        // エントリー終了後
        setShowForm(false)
        setEntryPhase('closed')
        setIsEntryOpen(false)
        setTimeUntilClose('エントリー受付終了')
      }
    }

    checkEntryStatus()
  }, [currentTime, entrySettings, settingsLoaded])

  const fetchLiveDates = async () => {
    try {
      const response = await fetch('/api/lives')
      const data = await response.json()
      setAvailableLives(data.lives || [])
    } catch (error) {
      console.error('Failed to fetch live dates:', error)
      setAvailableLives([])
    }
  }

  const fetchEntrySettings = async () => {
    try {
      const response = await fetch('/api/entry-status')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Fetched entry settings:', data.settings)
      
      // 設定が実際に変更された場合のみ状態を更新
      setEntrySettings((prevSettings: any) => {
        const settingsChanged = JSON.stringify(prevSettings) !== JSON.stringify(data.settings)
        if (settingsChanged) {
          setLastSettingsUpdate(Date.now())
        }
        return data.settings
      })
      
      if (!settingsLoaded) {
        setSettingsLoaded(true)
      }
    } catch (error) {
      console.error('Failed to fetch entry settings:', error)
      if (!settingsLoaded) {
        setSettingsLoaded(true)
      }
    }
  }

  const fetchPerformanceTypes = async () => {
    try {
      const response = await fetch('/api/performance-types')
      const data = await response.json()
      setPerformanceTypes(data.performanceTypes || [])
      setPerformanceTypesLoaded(true)
    } catch (error) {
      console.error('Failed to fetch performance types:', error)
      // フォールバック：デフォルト演目
      setPerformanceTypes([
        { id: 'default-1', name: '漫才（漫談）', order: 1 },
        { id: 'default-2', name: 'コント', order: 2 },
        { id: 'default-3', name: '未定', order: 3 }
      ])
      setPerformanceTypesLoaded(true)
    }
  }

  const handleDateToggle = useCallback((date: string) => {
    setFormData(prev => {
      const existingEntry = prev.entries.find(e => e.date === date)
      
      if (existingEntry) {
        // 既存のエントリーを削除
        return {
          ...prev,
          entries: prev.entries.filter(e => e.date !== date)
        }
      } else {
        // そのライブで利用可能な演目を取得
        const live = availableLives.find(l => l.dateString === date)
        const availablePerformanceTypes = live && live.allowedPerformanceTypes.length > 0 
          ? performanceTypes.filter(type => live.allowedPerformanceTypes.includes(type.id))
          : performanceTypes
        
        // 新しいエントリーを追加（デフォルトは最初の利用可能演目）
        const defaultPerformanceType = availablePerformanceTypes.length > 0 
          ? availablePerformanceTypes[0].name 
          : '漫才（漫談）'
        return {
          ...prev,
          entries: [...prev.entries, { date, performance_type: defaultPerformanceType }]
        }
      }
    })
  }, [performanceTypes, availableLives])

  const handlePerformanceTypeChange = useCallback((date: string, performanceType: string) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.map(entry => 
        entry.date === date 
          ? { ...entry, performance_type: performanceType }
          : entry
      )
    }))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEntryOpen) {
      alert('エントリー受付時間外です')
      return
    }

    // 必須項目チェック
    if (!formData.indies_name || !formData.entry_name) {
      alert('必須項目が入力されていません')
      return
    }
    
    if (formData.entries.length === 0) {
      alert('エントリー日を1つ以上選択してください')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/complete')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'エントリーの送信に失敗しました')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert(`エラーが発生しました: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }


  // まだマウントされていない場合はローディング表示
  if (!mounted || !currentTime) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 設定読み込み中の場合は待機画面を表示
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen gradient-bg relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="text-center px-4">
          <div className="glass-card max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              日の出寄席
            </h1>
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg text-gray-600">エントリー設定を読み込み中...</p>
            </div>
            <p className="text-2xl font-bold text-gray-800 font-mono">
              {currentTime?.toLocaleDateString('ja-JP')} {currentTime?.toLocaleTimeString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    )
  }


  // エントリー締切後の表示
  if (entryPhase === 'closed') {
    return (
      <div className="min-h-screen gradient-bg relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="text-center px-4">
          <div className="glass-card max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              日の出寄席
            </h1>
            
            <div className="mb-8">
              <p className="text-2xl font-semibold text-gray-900 mb-4">今回のエントリーは締め切りました</p>
              
              <p className="text-lg text-gray-600 mb-6">{timeUntilClose}</p>
              
              <a
                href="/schedule"
                className="inline-block px-8 py-4 bg-gray-900 text-white rounded-md font-semibold hover:shadow-xl hover:bg-black transform hover:scale-105 transition-all duration-300 text-lg"
              >
                🎭 香盤表を確認する
              </a>
            </div>
            
            <p className="text-2xl font-bold text-gray-800 font-mono">
              {currentTime?.toLocaleDateString('ja-JP')} {currentTime?.toLocaleTimeString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // エントリー日以外の通常時の表示
  if (entryPhase === 'waiting') {
    return (
      <div className="min-h-screen gradient-bg relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="text-center px-4">
          <div className="glass-card max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              日の出寄席
            </h1>
            
            <div className="mb-8">
              <p className="text-2xl font-semibold text-gray-800 mb-4">現在エントリー受付時間外です</p>
              
              <p className="text-lg text-gray-600 mb-6">{timeUntilClose}</p>
              
              <div className="bg-white/50 rounded-xl p-6 text-left mb-6">
                <h2 className="font-bold text-lg mb-3 text-gray-800">エントリー受付時間</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-gray-600"></span>
                    <div>
                      <p className="font-semibold text-gray-700">日の出寄席</p>
                      <p className="text-sm text-gray-600">毎月1日 24時間受付</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    香盤表は2日後に公開されます
                  </p>
                </div>
              </div>
              
              <a
                href="/schedule"
                className="inline-block px-8 py-4 bg-gray-900 text-white rounded-md font-semibold hover:shadow-xl hover:bg-black transform hover:scale-105 transition-all duration-300 text-lg"
              >
                🎭 香盤表を確認する
              </a>
            </div>
            
            <p className="text-2xl font-bold text-gray-800 font-mono">
              {currentTime?.toLocaleDateString('ja-JP')} {currentTime?.toLocaleTimeString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            日の出寄席
          </h1>
          <p className="text-xl text-gray-600">エントリーフォーム</p>
        </div>

        {/* Clock and Status */}
        <ClockDisplay currentTime={currentTime} timeUntilClose={timeUntilClose} />

        {/* 募集要項表示 */}
        {recruitmentText && (
          <div className="glass-card mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">募集要項</h2>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {recruitmentText}
            </div>
          </div>
        )}

        {/* Main form */}
        <form onSubmit={handleSubmit} className="card form-section">
          
          {/* 基本情報 */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">基本情報</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">コンビ名（ピン名） *</label>
                <input
                  type="text"
                  name="indies_name"
                  value={formData.indies_name}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">インディーズ名 *</label>
                <input
                  type="text"
                  name="entry_name"
                  value={formData.entry_name}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
            </div>


          </div>

          {/* エントリー日程・演目 */}
          <div className="mt-8 pt-8 border-t-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">エントリー日程・演目 *</h3>
            <p className="text-sm text-gray-600 mb-4">日付をクリックしてエントリー、演目を選択してください</p>
            
            <DateSelectionSection 
              availableLives={availableLives}
              formData={formData}
              performanceTypes={performanceTypes}
              onDateToggle={handleDateToggle}
              onPerformanceTypeChange={handlePerformanceTypeChange}
            />
            
            {formData.entries.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">選択中のエントリー:</p>
                <div className="space-y-1">
                  {formData.entries.map(entry => (
                    <div key={entry.date} className="text-sm text-blue-700">
                      {entry.date}: {entry.performance_type}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 備考 */}
          <div className="mt-8 pt-8 border-t-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">備考</h3>
            <div>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="8月5日は出番を早めにしてください / 8月19日は遅めの時間帯希望 / 特に希望なし"
                className="input-field"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">出番の時間帯やその他のご要望があれば記入してください（任意）</p>
            </div>
          </div>

          {/* 連絡先 */}
          <div className="mt-8 pt-8 border-t-2 border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">連絡先</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LINE URL</label>
              <input
                type="url"
                name="lineUrl"
                value={formData.lineUrl}
                onChange={handleChange}
                placeholder="https://line.me/ti/p/..."
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">LINE交換用のURLがあれば入力してください（任意）</p>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !isEntryOpen}
            className="w-full mt-8 btn-primary text-lg"
          >
            {isSubmitting ? (
              <span className="loading-dots">
                送信中
                <span></span>
                <span></span>
                <span></span>
              </span>
            ) : (
              isEntryOpen ? 'エントリーする' : '受付開始をお待ちください'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}