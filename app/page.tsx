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
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()
      if (data.banned) {
        setUser({ ...tgUser, isBanned: true, reason: data.reason });
      } else {
        setUser({ ...tgUser, points: data.points || 0 });
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      tg.ready(); tg.expand();
      fetchData(tg.initDataUnsafe.user)
    }
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'history' && user?.id) {
      fetch(`/api/increase-points?telegramId=${user.id}`).then(r => r.json()).then(d => setHistory(d.history || []))
    }
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders || [], users: d.users || [] }))
    }
  }, [activeTab, user?.id])

  const adminAction = async (data: any) => {
    const res = await fetch('/api/increase-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, adminId: ADMIN_ID }),
    })
    if (res.ok) {
       // تحديث البيانات بعد أي عملية إدارة
       fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders || [], users: d.users || [] }))
    }
  }

  if (user?.isBanned) return (
    <div style={{textAlign:'center', padding:'50px', color:'white'}}>
      <h1 style={{fontSize:'50px'}}>🚫</h1>
      <h2>عذراً، لقد تم حظرك</h2>
      <p style={{background:'rgba(255,0,0,0.1)', padding:'10px', borderRadius:'10px'}}>السبب: {user.reason || 'مخالفة الشروط'}</p>
    </div>
  )

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      {/* هيدر المستخدم المصلح */}
      <div className="user-header" style={{display:'flex', alignItems:'center', gap:'15px', padding:'15px', background:'rgba(255,255,255,0.05)', borderRadius:'15px', marginBottom:'15px'}}>
        <img src={user?.photo_url || 'https://via.placeholder.com/50'} style={{width:'50px', height:'50px', borderRadius:'50%', border:'2px solid var(--primary)'}} alt="" />
        <div>
          <div style={{fontWeight:'bold', fontSize:'16px'}}>{user?.first_name} <span style={{color:'var(--primary)'}}>(XP: {user?.points})</span></div>
          <div style={{fontSize:'12px', opacity:0.6}}>@{user?.username || 'no_user'}</div>
        </div>
      </div>

      <div className="tabs-container" style={{ display: 'grid', gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap:'5px', marginBottom:'15px' }}>
        <button onClick={() => setActiveTab('products')} className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}>إدارة</button>}
      </div>

      <div className="content-area">
        {activeTab === 'admin' && (
          <div className="admin-section">
            <h4 style={{color:'var(--primary)'}}>📦 طلبات بانتظار التأكيد</h4>
            {adminData.orders.map((o: any) => (
              <div key={o.id} className="history-item" style={{marginBottom:'10px', padding:'10px', background:'rgba(255,255,255,0.03)', borderRadius:'10px'}}>
                <div style={{fontSize:'12px'}}>ID: {o.telegramId} <br/> <b>{o.description}</b></div>
                <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                  <button onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'completed'})} style={{background:'#00b894', border:'none', color:'white', borderRadius:'5px', flex:1}}>قبول ✅</button>
                  <button onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'rejected'})} style={{background:'#d63031', border:'none', color:'white', borderRadius:'5px', flex:1}}>رفض ❌</button>
                </div>
              </div>
            ))}
            
            <h4 style={{color:'var(--primary)', marginTop:'20px'}}>👥 إدارة المستخدمين</h4>
            {adminData.users.map((u: any) => (
              <div key={u.id} className="history-item" style={{marginBottom:'8px', fontSize:'13px'}}>
                <span>@{u.username} ({u.points})</span>
                <div style={{display:'flex', gap:'5px'}}>
                  <button onClick={() => {
                    const amt = prompt('أدخل عدد النقاط (مثال: 50 أو -50)');
                    if(amt) adminAction({action:'manage_points', telegramId:u.telegramId, amount:amt})
                  }} style={{background:'var(--primary)', border:'none', borderRadius:'5px', color:'white'}}>💰</button>
                  <button onClick={() => {
                    const reason = prompt('سبب الحظر؟');
                    if(reason) adminAction({action:'toggle_ban', telegramId:u.telegramId, status:'ban', reason})
                  }} style={{background:'#333', border:'none', borderRadius:'5px', color:'white'}}>🚫</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* بقية الأقسام (المنتجات، المهام، السجل) */}
        {activeTab === 'products' && (
           <div className="products-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              {/* هنا تضع كود عرض المنتجات السابق */}
              <p style={{gridColumn:'1/3', textAlign:'center', opacity:0.5}}>اضغط على المنتج للشراء</p>
           </div>
        )}
        {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts: any) => setUser((u: any) => ({ ...u, points: pts }))} />}
        {activeTab === 'history' && (
          <div className="history-list">
             {history.map((h:any) => (
               <div key={h.id} className="history-item">
                  <span>{h.description}</span>
                  <span style={{color: h.status === 'pending' ? 'orange' : 'green'}}>{h.status === 'pending' ? '⏳' : '✅'}</span>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  )
}
