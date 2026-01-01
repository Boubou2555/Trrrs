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
  
  const products = [
    { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
    { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png", category: "باونتي" },
    { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" },
    { id: 5, title: "عضوية شهرية ", price: 600, imageUrl: "https://i.postimg.cc/DzZcwfYC/New-Project-40-8383-F74.png", category: "شحن" }
  ];

  const fetchData = useCallback(async (tgUser: any) => {
    const res = await fetch('/api/increase-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgUser),
    })
    const data = await res.json()
    if (data.banned) return setUser({ ...tgUser, isBanned: true, reason: data.reason })
    setUser({ ...tgUser, points: data.points || 0 })
    setLoading(false)
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

  const handlePurchase = (product: any) => {
    const tg = (window as any).Telegram?.WebApp
    if (user.points < product.price) return tg.showAlert('❌ رصيدك غير كافٍ')
    tg.showConfirm(`تأكيد شراء ${product.title} مقابل ${product.price} XP؟`, async (ok: any) => {
      if (ok) {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          body: JSON.stringify({ action: 'purchase_product', telegramId: user.id, price: product.price, productTitle: product.title, first_name: user.first_name }),
        })
        const data = await res.json()
        if (data.success) { setUser((p:any)=>({...p, points: data.newPoints})); tg.showAlert('✅ تم تقديم الطلب بنجاح!') }
      }
    })
  }

  const adminAction = async (payload: any) => {
    await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...payload, adminId: ADMIN_ID }) });
    fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders || [], users: d.users || [] }));
  }

  if (user?.isBanned) return (
    <div className="main-container" style={{textAlign:'center', padding:'100px 20px'}}>
      <h1 style={{fontSize:'60px'}}>🚫</h1>
      <h2>تم حظر حسابك</h2>
      <p style={{color:'red', background:'rgba(255,0,0,0.1)', padding:'15px', borderRadius:'10px'}}>السبب: {user.reason || 'مخالفة القوانين'}</p>
    </div>
  )

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      {/* 1. Header (صورة واسم ورصيد) */}
      <div className="user-header">
        <img src={user?.photo_url || 'https://via.placeholder.com/50'} className="user-avatar" alt="" />
        <div className="user-info">
          <div className="user-name">{user?.first_name}</div>
          <div className="user-username">@{user?.username || 'no_user'}</div>
        </div>
        <div className="header-balance">{user?.points} <span>XP</span></div>
      </div>

      {/* 2. Tabs */}
      <div className="tabs-container" style={{ display: 'grid', gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
        <button onClick={() => setActiveTab('products')} className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}>إدارة</button>}
      </div>

      {/* 3. Content Area */}
      <div className="content-area">
        {activeTab === 'products' && (
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" onClick={() => handlePurchase(p)}>
                <div className="product-image-container"><img src={p.imageUrl} alt="" className="product-image" /></div>
                <div className="product-info"><h3>{p.title}</h3><div className="product-price">{p.price} XP</div></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts: any) => setUser((u: any) => ({ ...u, points: pts }))} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div className="history-details"><p>{h.description}</p><span>{new Date(h.createdAt).toLocaleDateString()}</span></div>
                <div className={`history-amount ${h.amount > 0 ? 'plus' : 'minus'}`}>{h.amount > 0 ? `+${h.amount}` : h.amount}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-panel">
            <h4>📦 الطلبات ({adminData.orders.length})</h4>
            {adminData.orders.map((o:any) => (
              <div key={o.id} className="admin-card">
                <p>{o.description}</p>
                <div className="admin-btns">
                  <button onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'completed'})} className="btn-ok">تأكيد</button>
                  <button onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'rejected'})} className="btn-no">رفض</button>
                </div>
              </div>
            ))}
            <h4>👥 المستخدمين</h4>
            {adminData.users.map((u:any) => (
              <div key={u.id} className="admin-user-row">
                <span>@{u.username} ({u.points})</span>
                <div>
                  <button onClick={() => {const a = prompt('القيمة؟'); if(a) adminAction({action:'manage_points', telegramId:u.telegramId, amount:a})}}>💰</button>
                  <button onClick={() => {const r = prompt('السبب؟'); if(r) adminAction({action:'toggle_ban', telegramId:u.telegramId, status:'ban', reason:r})}}>🚫</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
