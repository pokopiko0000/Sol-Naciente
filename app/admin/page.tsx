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
  const [resetYear, setResetYear] = useState('')
  const [resetMonth, setResetMonth] = useState('')
  const [newLiveCapacity, setNewLiveCapacity] = useState('24')
  const [performanceTypes, setPerformanceTypes] = useState<any[]>([])
  const [newPerformanceType, setNewPerformanceType] = useState('')
  const [selectedPerformanceTypes, setSelectedPerformanceTypes] = useState<string[]>([])
  const [recruitmentText, setRecruitmentText] = useState('')

  // タブ切り替え関数（モバイル対応）
  const handleTabChange = (tab: 'entries' | 'schedule' | 'lives' | 'settings') => {
    console.log('Tab change requested:', tab);
    setActiveTab(tab);
  }

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
        setRecruitmentText(data.settings.recruitment_text || '')
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
      fetchPerformanceTypes()
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
      fetchPerformanceTypes()
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
          capacity: parseInt(newLiveCapacity),
          allowed_performance_types: selectedPerformanceTypes
        })
      })

      if (response.ok) {
        alert('ライブが追加されました')
        setNewLiveDate('')
        setNewLiveCapacity('24')
        setNewLiveHour('')
        setNewLiveMinute('00')
        setSelectedPerformanceTypes([])
        fetchLives()
      } else {
        alert('ライブの追加に失敗しました')
      }
    } catch (error) {
      console.error('Create live error:', error)
      alert('エラーが発生しました')
    }
  }

  const deleteLive = async (liveId: string) => {
    if (!confirm('このライブを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/lives/delete?id=${liveId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer owarai2025'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        fetchLives()
      } else {
        alert(data.error || 'ライブの削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete live error:', error)
      alert('エラーが発生しました')
    }
  }

  // 演目選択のハンドリング関数
  const handlePerformanceTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setSelectedPerformanceTypes(prev => [...prev, typeId])
    } else {
      setSelectedPerformanceTypes(prev => prev.filter(id => id !== typeId))
    }
  }

  // 募集要項設定更新
  const updateRecruitmentText = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recruitment_text: recruitmentText
        })
      })

      if (response.ok) {
        alert('募集要項が更新されました')
        fetchSettings()
      } else {
        alert('更新に失敗しました')
      }
    } catch (error) {
      console.error('Update settings error:', error)
      alert('エラーが発生しました')
    }
  }

  const fetchPerformanceTypes = async () => {
    try {
      const response = await fetch('/api/admin/performance-types', {
        headers: {
          'Authorization': 'Bearer owarai2025'
        }
      })
      const data = await response.json()
      setPerformanceTypes(data.performanceTypes || [])
    } catch (error) {
      console.error('Failed to fetch performance types:', error)
    }
  }

  const createPerformanceType = async () => {
    if (!newPerformanceType.trim()) {
      alert('演目名を入力してください')
      return
    }

    try {
      const response = await fetch('/api/admin/performance-types', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer owarai2025',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newPerformanceType.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        alert('演目が追加されました')
        setNewPerformanceType('')
        fetchPerformanceTypes()
      } else {
        alert(data.error || '演目の追加に失敗しました')
      }
    } catch (error) {
      console.error('Create performance type error:', error)
      alert('エラーが発生しました')
    }
  }

  const deletePerformanceType = async (id: string) => {
    if (!confirm('この演目を削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/performance-types?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer owarai2025'
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        fetchPerformanceTypes()
      } else {
        alert(data.error || '演目の削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete performance type error:', error)
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
        <div className="flex flex-wrap md:flex-nowrap mb-6 glass-card p-1 gap-1" style={{ position: 'relative', zIndex: 10 }}>
          <div
            onClick={() => handleTabChange('entries')}
            onTouchStart={() => handleTabChange('entries')}
            className={`flex-1 py-4 px-3 md:px-4 text-center rounded-lg transition-colors font-medium text-sm md:text-base select-none cursor-pointer ${
              activeTab === 'entries' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', userSelect: 'none' }}
            role="button"
            tabIndex={0}
          >
            エントリー一覧
          </div>
          <div
            onClick={() => handleTabChange('schedule')}
            onTouchStart={() => handleTabChange('schedule')}
            className={`flex-1 py-4 px-3 md:px-4 text-center rounded-lg transition-colors font-medium text-sm md:text-base select-none cursor-pointer ${
              activeTab === 'schedule' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', userSelect: 'none' }}
            role="button"
            tabIndex={0}
          >
            香盤表
          </div>
          <div
            onClick={() => handleTabChange('lives')}
            onTouchStart={() => handleTabChange('lives')}
            className={`flex-1 py-4 px-3 md:px-4 text-center rounded-lg transition-colors font-medium text-sm md:text-base select-none cursor-pointer ${
              activeTab === 'lives' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', userSelect: 'none' }}
            role="button"
            tabIndex={0}
          >
            ライブ管理
          </div>
          <div
            onClick={() => handleTabChange('settings')}
            onTouchStart={() => handleTabChange('settings')}
            className={`flex-1 py-4 px-3 md:px-4 text-center rounded-lg transition-colors font-medium text-sm md:text-base select-none cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', userSelect: 'none' }}
            role="button"
            tabIndex={0}
          >
            エントリー設定
          </div>
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
        </div>

        {/* エントリー一覧 */}
        {activeTab === 'entries' && (
          <div className="glass-card">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">エントリー一覧 ({entries.length}件)</h2>
                <button
                  onClick={assignEntries}
                  disabled={entries.length === 0 || isAssigning}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    entries.length === 0 || isAssigning
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg'
                  }`}
                >
                  {isAssigning ? '振り分け中...' : '自動振り分け実行'}
                </button>
              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                    <label className="block text-sm font-medium mb-1">定員数</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={newLiveCapacity}
                      onChange={(e) => setNewLiveCapacity(e.target.value)}
                      className="input-field"
                      placeholder="24"
                    />
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

                {/* 演目選択チェックボックス */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">対象演目選択</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {performanceTypes.map(type => (
                      <label key={type.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedPerformanceTypes.includes(type.id)}
                          onChange={(e) => handlePerformanceTypeChange(type.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">{type.name}</span>
                      </label>
                    ))}
                  </div>
                  {performanceTypes.length === 0 && (
                    <p className="text-gray-500 text-sm">演目が登録されていません。設定セクションで演目を追加してください。</p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">※ 選択した演目のみエントリーフォームに表示されます</p>
                </div>
              </div>

              {/* データリセット */}
              <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-red-800">データリセット</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">年</label>
                    <select
                      value={resetYear}
                      onChange={(e) => setResetYear(e.target.value)}
                      className="input-field"
                    >
                      <option value="">年を選択</option>
                      {[2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}年</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">月</label>
                    <select
                      value={resetMonth}
                      onChange={(e) => setResetMonth(e.target.value)}
                      className="input-field"
                    >
                      <option value="">月を選択</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}月</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        if (resetYear && resetMonth) {
                          resetSystem(parseInt(resetYear), parseInt(resetMonth))
                        } else {
                          alert('年と月を選択してください')
                        }
                      }}
                      className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-all duration-300"
                    >
                      選択した月のデータをリセット
                    </button>
                  </div>
                </div>
                <p className="text-sm text-red-600 mt-2">※ 選択した年月のエントリーとアサインメントがすべて削除されます</p>
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
                        <div>
                          <button
                            onClick={() => deleteLive(live.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all duration-300"
                          >
                            削除
                          </button>
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
                    エントリー設定を更新
                  </button>
                </div>

                {/* 募集要項テキスト編集エリア */}
                <div className="p-6 bg-white/50 border border-gray-200 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">募集要項設定</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">募集要項テキスト</label>
                    <textarea
                      value={recruitmentText}
                      onChange={(e) => setRecruitmentText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={8}
                      placeholder="募集要項の内容を入力してください..."
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">※ この内容がエントリーフォームの募集要項として表示されます</p>
                  <button
                    onClick={updateRecruitmentText}
                    className="btn-primary"
                  >
                    募集要項を更新
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
                      <p><strong>募集要項:</strong> {settings.recruitment_text ? '設定済み' : '未設定'}</p>
                    </div>
                  </div>
                )}

                {/* 演目管理 */}
                <div className="p-6 bg-white/50 border border-gray-200 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">演目管理</h3>
                  
                  {/* 新しい演目追加 */}
                  <div className="flex gap-4 mb-6">
                    <input
                      type="text"
                      value={newPerformanceType}
                      onChange={(e) => setNewPerformanceType(e.target.value)}
                      placeholder="新しい演目名"
                      className="input-field flex-1"
                    />
                    <button
                      onClick={createPerformanceType}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-300"
                    >
                      追加
                    </button>
                  </div>

                  {/* 既存演目一覧 */}
                  <div className="space-y-2">
                    {performanceTypes.map((type, index) => (
                      <div key={type.id} className="flex items-center justify-between p-3 bg-white/50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 font-mono w-8">{index + 1}</span>
                          <span className="font-medium">{type.name}</span>
                        </div>
                        <button
                          onClick={() => deletePerformanceType(type.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-all duration-300"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {performanceTypes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">演目が登録されていません</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}