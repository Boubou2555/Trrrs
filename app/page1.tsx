'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'
import Page1 from './page1'

const ADMIN_ID = 5149849049;

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks' | 'history' | 'admin'>('products')
  const [history, setHistory] = useState([])
  const [notifs, setNotifs] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [adminData, setAdminData] = useState({ orders: [], users: [] })

  const products = [
    { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png" },
    { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png" },
    { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png" }
  ];

  const fetchData = useCallback(async (tgUser: any) => {
    const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify(tgUser) })
    const data = await res.json()
    if (data.banned) return setUser({ ...tgUser, isBanned: true, reason: data.reason })
    setUser({ ...tgUser, points: data.points || 0 })
    setLoading(false)
  }, [])

  const refreshHistory = useCallback(() => {
    if (!user?.id) return;
    fetch(`/api/increase-points?telegramId=${user.id}`).then(r => r.json()).then(d => {
      setHistory(d.history || []);
      setNotifs(d.notifs || []);
    })
  }, [user?.id])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) { fetchData(tg.initDataUnsafe.user) }
  }, [fetchData])

  useEffect(() => {
    refreshHistory();
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders, users: d.users }))
    }
  }, [activeTab, refreshHistory])

  const markRead = async () => {
    setShowNotif(!showNotif);
    if (!showNotif) await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ action: 'read_notifs', telegramId: user.id }) });
    refreshHistory();
  }

  const adminDo = async (p: any) => {
    await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...p, adminId: ADMIN_ID }) });
    setActiveTab('products'); // Refresh
  }

  if (user?.isBanned) return <div className="banned-screen"><h1>🚫 حظر</h1><p>{user.reason}</p></div>
  if (loading) return <div className="loading-spinner"></div>

  const unread = notifs.filter((n: any) => !n.isRead).length;

  return (
    <div className="main-container">
      <div className="user-header">
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <img src={user?.photo_url} className="user-avatar" alt="" />
          <div><b>{user?.first_name}</b><br/><small>@{user?.username}</small></div>
        </div>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
           <div className="header-balance">{user?.points} XP</div>
           <div onClick={markRead} style={{position:'relative', fontSize:'22px', cursor:'pointer'}}>
             🔔 {unread > 0 && <span className="red-dot"></span>}
           </div>
        </div>

        {showNotif && (
          <div className="notif-box">
            <h4>الإشعارات</h4>
            {notifs.map((n: any) => (
              <div key={n.id} className="notif-item">
                <img src={n.iconUrl} width="25" alt=""/>
                <div><b>{n.title}</b><p>{n.message}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tabs-container" style={{display:'grid', gridTemplateColumns: user?.id === ADMIN_ID ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr'}}>
        <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={activeTab === 'tasks' ? 'active' : ''}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'active' : ''}>إدارة</button>}
      </div>

      <div className="content">
        {activeTab === 'products' && (
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" onClick={() => {
                const tg = (window as any).Telegram.WebApp;
                tg.showConfirm(`شراء ${p.title}؟`, (ok:any) => ok && adminDo({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title, first_name:user.first_name}))
              }}>
                <img src={p.imageUrl} alt=""/>
                <div className="p-info"><h3>{p.title}</h3><span>{p.price} XP</span></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={(p:any) => setUser((u:any)=>({...u, points:p}))} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div><b>{h.description}</b><br/><small>{h.status === 'pending' ? '⏳ قيد الانتظار' : '✅ مكتمل'}</small></div>
                <div className={h.amount > 0 ? 'plus' : 'minus'}>{h.amount > 0 ? `+${h.amount}` : h.amount}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-list">
            <h4>📦 الطلبات</h4>
            {adminData.orders.map((o:any) => (
              <div key={o.id} className="admin-card">
                <span>{o.description}</span>
                <div style={{display:'flex', gap:'5px'}}>
                   <button onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'completed'})}>✅</button>
                   <button onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'rejected'})}>❌</button>
                </div>
              </div>
            ))}
            <h4>👤 المستخدمين</h4>
            {adminData.users.map((u:any) => (
              <div key={u.id} className="admin-user-row">
                <span>@{u.username}</span>
                <div style={{display:'flex', gap:'5px'}}>
                   <button onClick={() => {const a=prompt('القيمة؟'); a && adminDo({action:'manage_points', telegramId:u.telegramId, amount:a})}}>💰</button>
                   <button onClick={() => {const t=prompt('العنوان'); const m=prompt('الرسالة'); t && adminDo({action:'send_notif', telegramId:u.telegramId, title:t, message:m})}}>🔔</button>
                   <button onClick={() => {const r=prompt('السبب؟'); r && adminDo({action:'toggle_ban', telegramId:u.telegramId, status:'ban', reason:r})}}>🚫</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
