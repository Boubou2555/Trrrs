'use client'

import { useEffect, useState, useCallback } from 'react'
import { WebApp } from '@twa-dev/types'
import './styles.css'
import Page1 from './page1'

declare global {
  interface Window {
    Telegram?: { WebApp: WebApp }
  }
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks'>('products')

  // دالة تحديث الرصيد لحظياً
  const updateBalance = (newPoints: number) => {
    setUser((prev: any) => prev ? { ...prev, points: newPoints } : null)
  }

  const fetchUserData = useCallback(async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()
      setUser({
        id: tgUser.id,
        firstName: tgUser.first_name,
        username: tgUser.username,
        points: data.points || 0,
        photoUrl: tgUser.photo_url
      })
    } catch (err) {
      console.error("Error fetching user data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      if (tg.initDataUnsafe.user) {
        fetchUserData(tg.initDataUnsafe.user)
      }
    }
  }, [fetchUserData])

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      <div className="user-header">
        <img src={user?.photoUrl || '/default-avatar.png'} className="user-avatar" alt="profile" />
        <div className="user-info">
          <h1 className="user-name">مرحباً، <span>{user?.firstName}</span>!</h1>
          <p className="user-username">@{user?.username || 'user'}</p>
        </div>
      </div>
      
      {/* بطاقة الرصيد التي تتحدث فوراً */}
      <div className="balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">{user?.points?.toLocaleString()} <span>XP</span></div>
      </div>

      <div className="tabs-container">
        <button className={`tab-button ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>المنتجات</button>
        <button className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>الهدية اليومية</button>
      </div>

      {activeTab === 'products' ? (
        <div className="products-grid">
           {/* محتوى المنتجات الخاص بك */}
           <p style={{textAlign:'center', opacity:0.5}}>قائمة المنتجات تظهر هنا...</p>
        </div>
      ) : ( 
        <Page1 onPointsUpdate={updateBalance} /> 
      )}

      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
