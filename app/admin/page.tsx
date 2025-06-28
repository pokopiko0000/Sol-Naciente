'use client'

import { useState, useEffect } from 'react'

type Entry = {
  id: string
  indies_name: string
  entry_name: string
  performance_type: string
  target_date: string
  remarks: string | null
  email: string
  timestamp: string
}

type Live = {
  id: string
  date: string
  capacity: number
  is_confirmed: boolean
  assignments: Array<{
    id: string
    order: number
    entry: Entry
  }>
}

export default function AdminPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [lives, setLives] = useState<Live[]>([])
  const [isAssigning, setIsAssigning] = useState(false)
  const [activeTab, setActiveTab] = useState<'entries' | 'schedule' | 'lives' | 'settings'>('entries')
  const [showContent, setShowContent] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [mounted, setMounted] = useState(false)
  const [newLiveDate, setNewLiveDate] = useState('')
  const [newLiveHour, setNewLiveHour] = useState('')
  const [newLiveMinute, setNewLiveMinute] = useState<'00' | '30'>('00')
  const [entryStartTime, setEntryStartTime] = useState('')
  const [entryEndTime, setEntryEndTime] = useState('')
  const [isEntryActive, setIsEntryActive] = useState(false)
  const [targetYear, setTargetYear] = useState('')
  const [targetMonth, setTargetMonth] = useState('')
  const [settings, setSettings] = useState<any>(null)

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/admin/entries', {
        headers: {
          'Authorization': 'Bearer owarai2025'
        }
      })
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    }
  }

  const fetchLives = async () => {
    try {
      const response = await fetch('/api/admin/lives', {
        headers: {
          'Authorization': 'Bearer owarai2025'
        }
      })
      const data = await response.json()
      setLives(data.lives || [])
    } catch (error) {
      console.error('Failed to fetch lives:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': 'Bearer owarai2025'
        }
      })
      const data = await response.json()
      console.log('Fetched admin settings:', data.settings)
      setSettings(data.settings)
      if (data.settings) {
        setEntryStartTime(data.settings.entry_start_time ? new Date(data.settings.entry_start_time).toISOString().slice(0, 16) : '')
        setEntryEndTime(data.settings.entry_end_time ? new Date(data.settings.entry_end_time).toISOString().slice(0, 16) : '')
        setIsEntryActive(data.settings.is_entry_active || false)
        setTargetYear(data.settings.target_year ? data.settings.target_year.toString() : '')
        setTargetMonth(data.settings.target_month ? data.settings.target_month.toString() : '')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
    // パスワード認証をチェック
    const adminAuth = localStorage.getItem('adminAuth')
    if (adminAuth === 'authorized') {
      setIsAuthorized(true)
      fetchEntries()
      fetchLives()
      fetchSettings()
    }
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'hinodeoyose2025') {
      setIsAuthorized(true)
      localStorage.setItem('adminAuth', 'authorized')
      fetchEntries()
      fetchLives()
      fetchSettings()
    } else {
      alert('パスワードが間違っています')
    }
  }

  const assignEntries = async () => {
    if (isAssigning) return
    
    setIsAssigning(true)
    try {
      const response = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        alert('振り分けが完了しました')
        fetchEntries()
        fetchLives()
      } else {
        alert('振り分けに失敗しました')
      }
    } catch (error) {
      console.error('Assignment error:', error)
      alert('エラーが発生しました')
    } finally {
      setIsAssigning(false)
    }
  }

  const createLive = async () => {
    if (!newLiveDate || !newLiveHour) {
      alert('日付と時間を入力してください')
      return
    }

    try {
      const datetime = `${newLiveDate}T${newLiveHour.padStart(2, '0')}:${newLiveMinute}:00`
      
      const response = await fetch('/api/admin/lives/manage', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: datetime,
          capacity: 24
        })
      })

      if (response.ok) {
        alert('ライブが追加されました')
        setNewLiveDate('')
        setNewLiveHour('')
        setNewLiveMinute('00')
        fetchLives()
      } else {
        alert('ライブの追加に失敗しました')
      }
    } catch (error) {
      console.error('Create live error:', error)
      alert('エラーが発生しました')
    }
  }

  const updateAssignmentOrder = async (liveId: string, assignmentId: string, newOrder: number) => {
    try {
      const response = await fetch('/api/admin/assignments/order', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          liveId,
          assignmentId,
          newOrder
        })
      })

      if (response.ok) {
        fetchLives() // ライブ情報を再取得
      } else {
        alert('順番の変更に失敗しました')
      }
    } catch (error) {
      console.error('Order update error:', error)
      alert('エラーが発生しました')
    }
  }

  const confirmSchedule = async (liveId: string) => {
    try {
      const response = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ liveId })
      })

      if (response.ok) {
        alert('香盤表が確定されました')
        fetchLives()
      } else {
        alert('香盤表の確定に失敗しました')
      }
    } catch (error) {
      console.error('Confirm error:', error)
      alert('エラーが発生しました')
    }
  }

  const updateEntrySettings = async () => {
    if (!entryStartTime || !entryEndTime) {
      alert('開始時間と終了時間を入力してください')
      return
    }

    if (!targetYear || !targetMonth) {
      alert('募集対象年月を選択してください')
      return
    }

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entry_start_time: new Date(entryStartTime).toISOString(),
          entry_end_time: new Date(entryEndTime).toISOString(),
          is_entry_active: isEntryActive,
          target_year: parseInt(targetYear),
          target_month: parseInt(targetMonth)
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Settings updated:', data)
        alert('エントリー設定が更新されました')
        fetchSettings()
      } else {
        const errorData = await response.json()
        console.error('Settings update failed:', errorData)
        alert('設定の更新に失敗しました: ' + (errorData.error || '不明なエラー'))
      }
    } catch (error) {
      console.error('Settings update error:', error)
      alert('エラーが発生しました')
    }
  }

  const resetSystem = async (year?: number, month?: number) => {
    const message = year && month 
      ? `本当に${year}年${month}月のデータをリセットしますか？該当月のすべてのエントリーとアサインメントが削除されます。`
      : '本当にシステムをリセットしますか？すべてのデータが削除されます。'
    
    if (!confirm(message)) {
      return
    }

    try {
      const body = year && month 
        ? { resetType: 'entries', year, month }
        : { resetType: 'entries' }

      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'リセットが完了しました')
        fetchEntries()
        fetchLives()
        fetchSettings()
      } else {
        alert('リセットに失敗しました')
      }
    } catch (error) {
      console.error('Reset error:', error)
      alert('エラーが発生しました')
    }
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen gradient-bg relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="glass-card max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-900">日の出寄席</h1>
          <p className="text-xl text-gray-600 text-center mb-8">管理画面</p>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="パスワードを入力"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">日の出寄席</h1>
          <p className="text-xl text-gray-600">管理画面</p>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex mb-6 glass-card p-1">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 py-3 px-4 text-center rounded-lg transition-colors font-medium ${
              activeTab === 'entries' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            エントリー一覧
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-3 px-4 text-center rounded-lg transition-colors font-medium ${
              activeTab === 'schedule' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            香盤表
          </button>
          <button
            onClick={() => setActiveTab('lives')}
            className={`flex-1 py-3 px-4 text-center rounded-lg transition-colors font-medium ${
              activeTab === 'lives' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ライブ管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 text-center rounded-lg transition-colors font-medium ${
              activeTab === 'settings' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            エントリー設定
          </button>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={assignEntries}
            disabled={isAssigning}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isAssigning ? '振り分け中...' : '自動振り分け実行'}
          </button>
          <button
            onClick={() => {
              const currentDate = new Date()
              const year = currentDate.getFullYear()
              const month = currentDate.getMonth() + 1
              resetSystem(year, month)
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300"
          >
            今月のデータをリセット
          </button>
        </div>

        {/* エントリー一覧 */}
        {activeTab === 'entries' && (
          <div className="glass-card">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">エントリー一覧 ({entries.length}件)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">受付時刻</th>
                      <th className="text-left py-2">インディーズ名</th>
                      <th className="text-left py-2">エントリー名</th>
                      <th className="text-left py-2">演目</th>
                      <th className="text-left py-2">対象日</th>
                      <th className="text-left py-2">備考</th>
                      <th className="text-left py-2">メール</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          {new Date(entry.timestamp).toLocaleString('ja-JP')}
                        </td>
                        <td className="py-2">{entry.indies_name}</td>
                        <td className="py-2">{entry.entry_name}</td>
                        <td className="py-2">{entry.performance_type}</td>
                        <td className="py-2">
                          {new Date(entry.target_date).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="py-2">{entry.remarks || '-'}</td>
                        <td className="py-2">{entry.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 香盤表 */}
        {activeTab === 'schedule' && (
          <div className="glass-card">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">香盤表</h2>
              {lives.map(live => {
                const startTime = new Date(live.date)
                const endTime = new Date(startTime.getTime() + 90 * 60 * 1000)
                
                return (
                  <div key={live.id} className="mb-6 bg-white/50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-800">
                      {startTime.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </h3>
                    <p className="text-md text-gray-700 mb-2">
                      {startTime.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} 〜 {endTime.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      出演者: {live.assignments.length}組 / 定員: {live.capacity}組
                    </p>
                    <div className="grid gap-2">
                      {live.assignments
                        .sort((a, b) => a.order - b.order)
                        .map((assignment, index) => (
                        <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <span className="w-8 text-center font-bold">{assignment.order}</span>
                            <span className="ml-4 font-medium">{assignment.entry.entry_name}</span>
                            <span className="ml-4 text-sm text-gray-600">
                              ({assignment.entry.indies_name})
                            </span>
                            <span className="ml-4 text-sm text-blue-600">
                              {assignment.entry.performance_type}
                            </span>
                            {assignment.entry.remarks && (
                              <span className="ml-4 text-sm text-orange-600">
                                備考: {assignment.entry.remarks}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (index > 0) {
                                  const prevAssignment = live.assignments
                                    .sort((a, b) => a.order - b.order)[index - 1]
                                  updateAssignmentOrder(live.id, assignment.id, prevAssignment.order)
                                  updateAssignmentOrder(live.id, prevAssignment.id, assignment.order)
                                }
                              }}
                              disabled={index === 0 || live.is_confirmed}
                              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => {
                                if (index < live.assignments.length - 1) {
                                  const nextAssignment = live.assignments
                                    .sort((a, b) => a.order - b.order)[index + 1]
                                  updateAssignmentOrder(live.id, assignment.id, nextAssignment.order)
                                  updateAssignmentOrder(live.id, nextAssignment.id, assignment.order)
                                }
                              }}
                              disabled={index === live.assignments.length - 1 || live.is_confirmed}
                              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {live.assignments.length > 0 && (
                      <div className="mt-4 flex justify-end">
                        {!live.is_confirmed ? (
                          <button
                            onClick={() => confirmSchedule(live.id)}
                            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-black transition-all duration-300"
                          >
                            香盤表を確定する
                          </button>
                        ) : (
                          <span className="text-gray-700 font-semibold bg-gray-100 px-4 py-2 rounded-lg">✓ 確定済み</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ライブ管理 */}
        {activeTab === 'lives' && (
          <div className="glass-card">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">ライブ管理</h2>
              
              {/* 新しいライブ追加 */}
              <div className="mb-8 p-6 bg-white/50 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-800">新しいライブを追加</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">日付</label>
                    <input
                      type="date"
                      value={newLiveDate}
                      onChange={(e) => setNewLiveDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">開始時間</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newLiveHour}
                      onChange={(e) => setNewLiveHour(e.target.value)}
                      className="input-field"
                      placeholder="19"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">分</label>
                    <select
                      value={newLiveMinute}
                      onChange={(e) => setNewLiveMinute(e.target.value as '00' | '30')}
                      className="input-field"
                    >
                      <option value="00">00</option>
                      <option value="30">30</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">終演予定</label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                      {newLiveHour && newLiveMinute ? (() => {
                        const startTime = new Date(`2000-01-01T${newLiveHour.padStart(2, '0')}:${newLiveMinute}:00`)
                        const endTime = new Date(startTime.getTime() + 90 * 60 * 1000)
                        return endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                      })() : '--:--'}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={createLive}
                      className="btn-primary w-full"
                    >
                      追加
                    </button>
                  </div>
                </div>
              </div>

              {/* 既存ライブ一覧 */}
              <div className="space-y-4">
                {lives.map(live => {
                  const startTime = new Date(live.date)
                  const endTime = new Date(startTime.getTime() + 90 * 60 * 1000)
                  
                  return (
                    <div key={live.id} className="p-6 bg-white/50 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">
                            {startTime.toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </h4>
                          <p className="text-lg text-gray-700 mt-1">
                            {startTime.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} 〜 {endTime.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            出演者: {live.assignments.length}組 / 定員: {live.capacity}組
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* エントリー設定 */}
        {activeTab === 'settings' && (
          <div className="glass-card">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">エントリー受付設定</h2>
              
              <div className="space-y-8">
                <div className="p-6 bg-white/50 border border-gray-200 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">エントリー受付時間設定</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">開始日時</label>
                      <input
                        type="datetime-local"
                        value={entryStartTime}
                        onChange={(e) => setEntryStartTime(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">終了日時</label>
                      <input
                        type="datetime-local"
                        value={entryEndTime}
                        onChange={(e) => setEntryEndTime(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="mb-4 p-4 border rounded-lg bg-blue-50">
                    <h4 className="text-md font-semibold mb-3 text-blue-800">募集対象月設定</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">年</label>
                        <select
                          value={targetYear}
                          onChange={(e) => setTargetYear(e.target.value)}
                          className="input-field"
                        >
                          <option value="">年を選択</option>
                          {[2024, 2025, 2026].map(year => (
                            <option key={year} value={year}>{year}年</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">月</label>
                        <select
                          value={targetMonth}
                          onChange={(e) => setTargetMonth(e.target.value)}
                          className="input-field"
                        >
                          <option value="">月を選択</option>
                          {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{month}月</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-sm text-blue-600">
                      ※ エントリーフォームには選択した月に登録されたライブ日程のみが表示されます
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isEntryActive}
                        onChange={(e) => setIsEntryActive(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">エントリー受付を有効にする</span>
                    </label>
                  </div>

                  <button
                    onClick={updateEntrySettings}
                    className="btn-primary"
                  >
                    設定を更新
                  </button>
                </div>

                {settings && (
                  <div className="p-6 bg-white/30 border border-gray-200 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">現在の設定</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>開始日時:</strong> {settings.entry_start_time ? new Date(settings.entry_start_time).toLocaleString('ja-JP') : '未設定'}</p>
                      <p><strong>終了日時:</strong> {settings.entry_end_time ? new Date(settings.entry_end_time).toLocaleString('ja-JP') : '未設定'}</p>
                      <p><strong>募集対象:</strong> {settings.target_year && settings.target_month ? `${settings.target_year}年${settings.target_month}月` : '未設定'}</p>
                      <p><strong>受付状態:</strong> {settings.is_entry_active ? '受付中' : '受付停止'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}