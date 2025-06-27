'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type EntryForm = {
  entryNumber: '1' | '2'
  name1: string
  representative1: string
  preference1_1: string
  preference1_2: string
  preference1_3: string
  name2: string
  representative2: string
  preference2_1: string
  preference2_2: string
  preference2_3: string
  email: string
  lineUrl: string
  liveType: 'KUCHIBE' | 'NIWARA'
}

export default function EntryPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<EntryForm>({
    entryNumber: '1',
    name1: '',
    representative1: '',
    preference1_1: '',
    preference1_2: '',
    preference1_3: '',
    name2: '',
    representative2: '',
    preference2_1: '',
    preference2_2: '',
    preference2_3: '',
    email: '',
    lineUrl: '',
    liveType: 'KUCHIBE'
  })
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEntryOpen, setIsEntryOpen] = useState(false)
  const [dates, setDates] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [timeUntilOpen, setTimeUntilOpen] = useState('')
  const [mounted, setMounted] = useState(false)
  const [entryPhase, setEntryPhase] = useState<'waiting' | 'form_only' | 'accepting' | 'closed'>('waiting')

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      
      const date = now.getDate()
      const hour = now.getHours()
      const minute = now.getMinutes()
      
      // エントリー日の判定（1日と10日）
      // 開発環境では常にエントリー日として扱う
      const isTestMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_TEST_MODE === 'true'
      const isEntryDay = isTestMode ? true : (date === 1 || date === 10)
      
      // エントリー時間の判定（22:00-23:00）
      // 開発環境では常に受付中として扱う
      const isEntryTime = isTestMode ? true : (hour === 22 && minute < 60)
      
      if (isEntryDay) {
        setShowForm(true)
        
        if (isEntryTime) {
          // 22:00-23:00: エントリー受付中（開発環境では常に受付中）
          setEntryPhase('accepting')
          setIsEntryOpen(true)
          if (isTestMode) {
            setTimeUntilOpen('開発環境：受付中')
          } else {
            const remainingMinutes = 59 - minute
            const remainingSeconds = 60 - now.getSeconds()
            setTimeUntilOpen(`残り${remainingMinutes}分${remainingSeconds}秒`)
          }
        } else if (hour < 22) {
          // エントリー日の22:00前: フォーム入力可能、送信不可
          setEntryPhase('form_only')
          setIsEntryOpen(false)
          const hoursUntil = 21 - hour
          const minutesUntil = 60 - minute
          setTimeUntilOpen(`${hoursUntil}時間${minutesUntil}分後に受付開始`)
        } else {
          // エントリー日の23:00以降: 締切
          setEntryPhase('closed')
          setIsEntryOpen(false)
          setShowForm(false)
          
          // 次回エントリー日の計算
          const currentLiveType = formData.liveType
          let nextDate: number
          let nextMonth = now.getMonth()
          let nextYear = now.getFullYear()
          
          if (currentLiveType === 'KUCHIBE') {
            // 口火: 毎月1日
            nextDate = 1
            // 今日が1日以降なら来月の1日
            if (date >= 1) {
              nextMonth = nextMonth + 1
              if (nextMonth > 11) {
                nextMonth = 0
                nextYear = nextYear + 1
              }
            }
          } else {
            // 二足のわらじ: 毎月10日
            nextDate = 10
            // 今日が10日以降なら来月の10日
            if (date >= 10) {
              nextMonth = nextMonth + 1
              if (nextMonth > 11) {
                nextMonth = 0
                nextYear = nextYear + 1
              }
            }
          }
          
          const nextEntryDate = new Date(nextYear, nextMonth, nextDate)
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const daysUntil = Math.ceil((nextEntryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          setTimeUntilOpen(`次回エントリーまで${daysUntil}日`)
        }
      } else {
        // エントリー日でない場合
        setEntryPhase('waiting')
        setShowForm(false)
        setIsEntryOpen(false)
        
        // 次回エントリー日の計算
        const currentLiveType = formData.liveType
        let nextDate: number
        let nextMonth = now.getMonth()
        let nextYear = now.getFullYear()
        
        if (currentLiveType === 'KUCHIBE') {
          // 口火: 毎月1日
          nextDate = 1
          if (date >= 1) {
            nextMonth = nextMonth + 1
            if (nextMonth > 11) {
              nextMonth = 0
              nextYear = nextYear + 1
            }
          }
        } else {
          // 二足のわらじ: 毎月10日
          nextDate = 10
          if (date >= 10) {
            nextMonth = nextMonth + 1
            if (nextMonth > 11) {
              nextMonth = 0
              nextYear = nextYear + 1
            }
          }
        }
        
        const nextEntryDate = new Date(nextYear, nextMonth, nextDate)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const daysUntil = Math.ceil((nextEntryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        setTimeUntilOpen(`次回エントリーまで${daysUntil}日`)
      }
    }, 1000)

    fetchLiveDates()
    
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLiveDates = async (liveType?: 'KUCHIBE' | 'NIWARA') => {
    try {
      const typeToFetch = liveType || formData.liveType
      const response = await fetch(`/api/lives?type=${typeToFetch}`)
      const data = await response.json()
      setDates(data.dates || [])
    } catch (error) {
      console.error('Failed to fetch live dates:', error)
      setDates([])
    }
  }

  const canSubmit = () => {
    if (!currentTime) return false
    const hour = currentTime.getHours()
    const minute = currentTime.getMinutes()
    const date = currentTime.getDate()
    
    // エントリー日の22:00-23:00のみ送信可能
    return (date === 1 || date === 10) && hour === 22 && minute < 60
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted, currentTime:', currentTime)
    console.log('canSubmit():', canSubmit())
    
    if (!canSubmit()) {
      alert('エントリー受付時間外です')
      return
    }

    // 必須項目チェック
    if (!formData.name1 || !formData.representative1 || !formData.email || !formData.liveType) {
      alert('必須項目が入力されていません')
      return
    }
    
    // 第1希望は必須
    if (!formData.preference1_1) {
      alert('第1希望は必須です')
      return
    }
    
    // 2つエントリーの場合、名義2の第1希望も必須
    if (formData.entryNumber === '2' && (!formData.name2 || !formData.representative2 || !formData.preference2_1)) {
      alert('名義2の必須項目（名義名・代表者名・第1希望）が入力されていません')
      return
    }

    console.log('Time check passed, submitting...')
    setIsSubmitting(true)

    try {
      console.log('Submitting form data:', formData)
      
      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.text()
      console.log('Response status:', response.status)
      console.log('Response data:', responseData)

      if (response.ok) {
        router.push('/complete')
      } else {
        let errorMessage = 'エントリーの送信に失敗しました'
        try {
          const errorData = JSON.parse(responseData)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          errorMessage += `\nステータス: ${response.status}\nレスポンス: ${responseData}`
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert(`エラーが発生しました: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // エントリー締切後の表示
  if (entryPhase === 'closed') {
    return (
      <div className="min-h-screen gradient-bg relative overflow-hidden flex items-center justify-center">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="text-center px-4">
          <div className="glass-card max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {formData.liveType === 'KUCHIBE' ? '口火' : '二足のわらじ'}
            </h1>
            
            <div className="mb-8">
              <p className="text-2xl font-semibold text-gray-900 mb-4">今回のエントリーは締め切りました</p>
              
              {timeUntilOpen && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">次回エントリーまで</p>
                  <p className="text-3xl font-bold text-gray-900 font-mono">{timeUntilOpen}</p>
                </div>
              )}
              
              <div className="bg-white/50 rounded-xl p-6 text-left mb-6">
                <h2 className="font-bold text-lg mb-3 text-gray-800">次回エントリー受付時間</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-gray-600"></span>
                    <div>
                      <p className="font-semibold text-gray-700">{formData.liveType === 'KUCHIBE' ? '口火' : '二足のわらじ'}</p>
                      <p className="text-sm text-gray-600">毎月{formData.liveType === 'KUCHIBE' ? '1' : '10'}日 22:00-23:00</p>
                      <p className="text-xs text-gray-500 mt-1">※エントリーは翌月公演分（7月は8月公演）</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    香盤表は振り分け完了後に公開されます
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
              {currentTime.toLocaleDateString('ja-JP')} {currentTime.toLocaleTimeString('ja-JP')}
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
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="text-center px-4">
          <div className="glass-card max-w-2xl mx-auto">
            {/* Live type selector */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setFormData({ ...formData, liveType: 'KUCHIBE' })
                    fetchLiveDates('KUCHIBE')
                  }}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    formData.liveType === 'KUCHIBE'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  口火
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...formData, liveType: 'NIWARA' })
                    fetchLiveDates('NIWARA')
                  }}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    formData.liveType === 'NIWARA'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  二足のわらじ
                </button>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {formData.liveType === 'KUCHIBE' ? '口火' : '二足のわらじ'}
            </h1>
            
            <div className="mb-8">
              <p className="text-2xl font-semibold text-gray-800 mb-4">現在エントリー受付時間外です</p>
              
              {timeUntilOpen && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">次回エントリーまで</p>
                  <p className="text-3xl font-bold text-gray-900 font-mono">{timeUntilOpen}</p>
                </div>
              )}
              
              <div className="bg-white/50 rounded-xl p-6 text-left mb-6">
                <h2 className="font-bold text-lg mb-3 text-gray-800">エントリー受付時間</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-gray-600"></span>
                    <div>
                      <p className="font-semibold text-gray-700">{formData.liveType === 'KUCHIBE' ? '口火' : '二足のわらじ'}</p>
                      <p className="text-sm text-gray-600">毎月{formData.liveType === 'KUCHIBE' ? '1' : '10'}日 22:00-23:00</p>
                      <p className="text-xs text-gray-500 mt-1">※エントリーは翌月公演分（7月は8月公演）</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    エントリー当日は22:00からエントリー受付開始
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
              {currentTime.toLocaleDateString('ja-JP')} {currentTime.toLocaleTimeString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '4s' }}></div>

      <div className={`max-w-2xl mx-auto px-4 py-8 transition-all duration-1000 ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {formData.liveType === 'KUCHIBE' ? '口火' : '二足のわらじ'}
          </h1>
          <p className="text-xl text-gray-600">エントリーフォーム</p>
          <p className="text-sm text-gray-500 mt-2">
            {(() => {
              const date = currentTime.getDate()
              const month = currentTime.getMonth() + 1
              if (month === 7 && (date === 1 || date === 10)) {
                return '※8月公演のエントリー受付'
              }
              const nextMonth = month === 12 ? 1 : month + 1
              return `※${nextMonth}月公演のエントリー受付`
            })()}
          </p>
        </div>
        

        {/* Live type selector */}
        <div className="glass-card mb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setFormData({ ...formData, liveType: 'KUCHIBE' })
                fetchLiveDates('KUCHIBE')
              }}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                formData.liveType === 'KUCHIBE'
                  ? 'bg-gray-900 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              口火
            </button>
            <button
              onClick={() => {
                setFormData({ ...formData, liveType: 'NIWARA' })
                fetchLiveDates('NIWARA')
              }}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                formData.liveType === 'NIWARA'
                  ? 'bg-gray-900 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              二足のわらじ
            </button>
          </div>
        </div>

        {/* Clock and Status */}
        <div className="glass-card mb-8 text-center">
          <p className="text-3xl font-bold text-gray-800 mb-2 font-mono">
            {currentTime.toLocaleTimeString('ja-JP')}
          </p>
          {entryPhase === 'form_only' && (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">エントリー受付前</p>
              <p className="text-sm text-gray-600">{timeUntilOpen}</p>
              <p className="text-xs text-gray-500">フォーム入力は可能、送信は22:00から</p>
            </div>
          )}
          {entryPhase === 'accepting' && (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">エントリー受付中</p>
              <p className="text-sm text-gray-600">{timeUntilOpen}</p>
            </div>
          )}
        </div>

        {/* 募集要項 */}
        <div className="glass-card mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {formData.liveType === 'KUCHIBE' ? '【口火募集要項】' : '【二足のわらじ募集要項】'}
          </h2>
          
          {formData.liveType === 'KUCHIBE' ? (
            <div className="text-sm text-gray-700 space-y-3">
              <div className="bg-gray-100 p-3 rounded-md border-l-4 border-gray-900">
                <p className="font-semibold text-gray-900 mb-1">重要事項</p>
                <p>※同じ人は月2回までしか出演できません。</p>
                <p className="text-xs mt-1">(例:ボニーボニーで1回出演・花﨑ピンで1回出演した場合、花﨑さんはもうその月は出演不可。とくのしんさんはあと1回ピンでも別ユニットでも出演可)</p>
                <p className="text-xs mt-1">※もし月3回以上出演していることが発覚した場合は、その人は次回以降エントリーをお断りする可能性があります</p>
              </div>
              
              <div className="space-y-2">
                <p><span className="font-semibold">①</span> 出演される際の名義、希望の日程を1通のDMにまとめて明記の上、@gakuya_jinnoまでDMをお送りください。複数日エントリーする場合や、複数名義エントリーされる場合も1通にまとめてください。送り方を守らなかった方はエントリーから除外します。</p>
                
                <p><span className="font-semibold">②</span> 運営の募集開始ポストを待たずとも、開始時間になった時点でエントリーしていただくことが可能です。</p>
                
                <p><span className="font-semibold">③</span> 募集中にエントリーを元に振り分け、全日程が埋まった時点で締め切らせていただきます。最低でも1日は出演いただけるように振り分けますが、応募多数のためお断りさせていただく場合がございます。</p>
                
                <p><span className="font-semibold">④</span> @gakuya_jinnoから決定した出演日をご連絡させていただきます。こちらからの返信がない場合、不具合の可能性がございますのでリプライかLINEにてご連絡お願いいたします。</p>
                
                <p><span className="font-semibold">⑤</span> 複数日ご出演していただくことは可能ですが、1位を取ったからという理由でそれ以降の出演をキャンセルするのはNGです。その場合は代わりの出演者をご自身で探していただき、見つかった場合のみキャンセル可能と致します。</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 space-y-3">
              <div className="space-y-2">
                <p><span className="font-semibold">①</span> 出演される際の名義、希望の日程を1通のDMにまとめて明記の上、@gakuya_jinnoまでDMをお送りください。複数日エントリーする場合や、複数名義エントリーされる場合も1通にまとめてください。送り方を守らなかった方はエントリーから除外します。</p>
                
                <p><span className="font-semibold">②</span> 運営の募集開始ポストを待たずとも、開始時間になった時点でエントリーしていただくことが可能です。</p>
                
                <p><span className="font-semibold">③</span> 募集中にエントリーを元に振り分け、全日程が埋まった時点で締め切らせていただきます。最低でも1日は出演いただけるように振り分けますが、応募多数のためお断りさせていただく場合がございます。</p>
                
                <p><span className="font-semibold">④</span> @gakuya_jinnoから決定した出演日をご連絡させていただきます。こちらからの返信がない場合、不具合の可能性がございますのでリプライかLINEにてご連絡お願いいたします。</p>
                
                <p><span className="font-semibold">⑤</span> 複数日ご出場していただくことは可能ですが、1位を取ったからという理由でそれ以降の出演キャンセルするのはNGです。その場合は代わりの出演者をご自身で探していただき、見つかった場合のみキャンセル可能と致します。</p>
                
                <p><span className="font-semibold">⑥</span> 過去に1位を獲得した組であっても再度エントリーは可能です。</p>
              </div>
            </div>
          )}
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="card form-section">
          
          {/* Entry number selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-4">エントリー数</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="label-modern">
                <input
                  type="radio"
                  name="entryNumber"
                  value="1"
                  checked={formData.entryNumber === '1'}
                  onChange={handleChange}
                  className="radio-modern"
                />
                <span className="font-medium">1つ</span>
              </label>
              <label className="label-modern">
                <input
                  type="radio"
                  name="entryNumber"
                  value="2"
                  checked={formData.entryNumber === '2'}
                  onChange={handleChange}
                  className="radio-modern"
                />
                <span className="font-medium">2つ</span>
              </label>
            </div>
          </div>

          {/* Entry 1 */}
          <div className="space-y-6 relative">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              名義1
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">名義名 *</label>
                <input
                  type="text"
                  name="name1"
                  value={formData.name1}
                  onChange={handleChange}
                  required
                  placeholder="コンビ名/芸名"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">代表者名 *</label>
                <input
                  type="text"
                  name="representative1"
                  value={formData.representative1}
                  onChange={handleChange}
                  required
                  placeholder="山田太郎"
                  className="input-field"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">第1希望 *</label>
                <select
                  name="preference1_1"
                  value={formData.preference1_1}
                  onChange={handleChange}
                  required
                  className="select-field"
                >
                  <option value="">選択してください</option>
                  {dates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">第2希望</label>
                <select
                  name="preference1_2"
                  value={formData.preference1_2}
                  onChange={handleChange}
                  className="select-field"
                >
                  <option value="">選択してください</option>
                  {dates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">第3希望</label>
                <select
                  name="preference1_3"
                  value={formData.preference1_3}
                  onChange={handleChange}
                  className="select-field"
                >
                  <option value="">選択してください</option>
                  {dates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Entry 2 */}
          {formData.entryNumber === '2' && (
            <>
              <div className="section-divider"></div>
              
              <div className="space-y-6 relative">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                  名義2
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">名義名 *</label>
                    <input
                      type="text"
                      name="name2"
                      value={formData.name2}
                      onChange={handleChange}
                      required={formData.entryNumber === '2'}
                      placeholder="コンビ名/芸名"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">代表者名 *</label>
                    <input
                      type="text"
                      name="representative2"
                      value={formData.representative2}
                      onChange={handleChange}
                      required={formData.entryNumber === '2'}
                      placeholder="山田太郎"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">第1希望 *</label>
                    <select
                      name="preference2_1"
                      value={formData.preference2_1}
                      onChange={handleChange}
                      required={formData.entryNumber === '2'}
                      className="select-field"
                    >
                      <option value="">選択してください</option>
                      {dates.map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">第2希望</label>
                    <select
                      name="preference2_2"
                      value={formData.preference2_2}
                      onChange={handleChange}
                      className="select-field"
                    >
                      <option value="">選択してください</option>
                      {dates.map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">第3希望</label>
                    <select
                      name="preference2_3"
                      value={formData.preference2_3}
                      onChange={handleChange}
                      className="select-field"
                    >
                      <option value="">選択してください</option>
                      {dates.map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="mt-8 pt-8 border-t-2 border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">連絡先メールアドレス *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
                className="input-field"
              />
            </div>
            
            {/* LINE URL */}
            <div className="mt-4">
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
            disabled={isSubmitting || !canSubmit()}
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
              canSubmit() ? 'エントリーする' : 
              entryPhase === 'form_only' ? '22:00から送信可能' : 
              '受付開始をお待ちください'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}