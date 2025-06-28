'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CompletePage() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
  }, [])

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden flex items-center justify-center">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className={`text-center px-4 transition-all duration-1000 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="glass-card max-w-lg mx-auto">
          {/* Success icon */}
          <div className="mb-6 success-animation">
            <div className="w-24 h-24 mx-auto bg-gray-900 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            エントリー受付完了！
          </h1>
          
          <p className="text-gray-700 mb-8 text-lg">
            出演の可否は後日決定予定です。<br />
            下記で香盤表をご確認ください。
          </p>
          
          <Link
            href="/schedule"
            className="inline-block btn-primary"
          >
            <span className="flex items-center gap-2">
              香盤表ページへ
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
          </Link>
          
          <p className="mt-6 text-sm text-gray-600">
            ※このページをブックマーク推奨
          </p>
        </div>
      </div>
    </div>
  )
}