'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'
import Page1 from './page1'

const ADMIN_ID = 5149849049;

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks' | 'history' | 'admin'>('products')
  const [history, setHistory] = useState<any[]>([])
  const [adminData, setAdminData] = useState({ orders: [], users: [] })

  const fetchData = useCallback(async (tgUser: any) => {
    const res = await fetch('/api/increase-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgUser),
    })
    const data = await res.json()
    if (data.banned) return setUser({ ...tgUser, isBanned: true, reason: data.reason })
    if (data.success) setUser({ ...tgUser, points: data.points || 0 })
    setLoading(false)
  }, [])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      fetchData(tg.initDataUnsafe.user)
    }
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders, users: d.users }))
    }
  }, [activeTab])

  if (user?.isBanned) return (
    <div className="main-container" style={{textAlign:'center', paddingTop:'100px'}}>
      <h1>🚫 تم حظرك</h1>
      <p style={{color:'var(--danger)'}}>{user.reason || 'مخالفة القوانين'}</p>
    </div>
  )

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      {/* استعادة الهيدر بصورة المستخدم واسمه */}
      <div className="user-header">
        <img src={user?.photo_url || 'https://via.placeholder.com/55'} className="user-avatar" alt="" />
        <div className="user-info">
          <div className="user-name">{user?.first_name} <span>(XP: {user?.points})</span></div>
          <div className="user-username">@{user?.username || 'no_user'}</div>
        </div>
      </div>

      <div className="tabs-container" style={{ display: 'grid', gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
        <button onClick={() => setActiveTab('products')} className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}>إدارة</button>}
      </div>

      <div className="content-area">
        {activeTab === 'admin' && (
          <div className="admin-panel">
            <h4>📦 الطلبات المعلقة</h4>
            {adminData.orders.map((o: any) => (
              <div key={o.id} className="history-item">
                <div style={{fontSize:'12px'}}>ID: {o.telegramId} <br/> {o.description}</div>
                <div style={{display:'flex', gap:'5px'}}>
                  <button onClick={() => /* دالة التحديث */} style={{background:'green'}}>✅</button>
                  <button onClick={() => /* دالة التحديث */} style={{background:'red'}}>❌</button>
                </div>
              </div>
            ))}
            <hr/>
            <h4>👥 قائمة المستخدمين</h4>
            {adminData.users.map((u: any) => (
              <div key={u.id} className="history-item">
                <span>@{u.username} ({u.points})</span>
                <button onClick={() => {
                  const amt = prompt('أدخل القيمة (مثال: 50 للزيادة أو -50 للخصم)');
                  if(amt) fetch('/api/increase-points', { method:'POST', body: JSON.stringify({adminId:ADMIN_ID, action:'manage_points', telegramId:u.telegramId, amount:amt}) })
                }}>💰</button>
              </div>
            ))}
          </div>
        )}
        {/* بقية التبويبات (Page1, Products, History) تظل كما هي */}
      </div>
    </div>
  )
}
