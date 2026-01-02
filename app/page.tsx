
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
    const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({...tgUser, action: 'login_check'}) })
    const data = await res.json()
    if (data.banned) {
      setUser({ ...tgUser, isBanned: true, reason: data.reason });
    } else {
      setUser({ ...tgUser, points: data.points || 0, isBanned: false });
    }
    setLoading(false)
  }, [])

  const refreshData = useCallback(() => {
    if (!user?.id || user.isBanned) return;
    fetch(`/api/increase-points?telegramId=${user.id}`).then(r => r.json()).then(d => {
      setHistory(d.history || []);
      setNotifs(d.notifs || []);
    })
  }, [user?.id, user?.isBanned])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) { fetchData(tg.initDataUnsafe.user) }
  }, [fetchData])

  useEffect(() => {
    refreshData();
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders, users: d.users }))
    }
  }, [activeTab, refreshData])

  const adminDo = async (p: any) => {
    const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...p, adminId: ADMIN_ID }) });
    const data = await res.json();
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders, users: d.users }));
    }
    return data;
  }

  // تحديث الرصيد عند مشاهدة إعلان في Page1
  const handlePointsUpdate = (newPoints: number) => {
    setUser((prev: any) => ({ ...prev, points: newPoints }));
    refreshData();
  };

  if (user?.isBanned) return (
    <div className="banned-screen">
      <div style={{fontSize:'80px'}}>🚫</div>
      <h2 style={{color:'var(--danger)'}}>عذراً، أنت محظور!</h2>
      <div className="history-item" style={{marginTop:'20px', justifyContent:'center'}}>
        <b>السبب: {user.reason || "مخالفة القوانين"}</b>
      </div>
      <p style={{marginTop:'20px', opacity:0.6}}>تواصل مع المسؤول لفك الحظر</p>
    </div>
  )

  if (loading) return <div className="loading-spinner"></div>

  const unread = notifs.filter((n: any) => !n.isRead).length;

  return (
    <div className="main-container">
      <div className="user-header">
        <div className="header-left">
          <img src={user?.photo_url || 'https://via.placeholder.com/50'} className="user-avatar" alt="" />
          <div className="user-info">
            <div className="user-name">{user?.first_name}</div>
            <div className="user-username">@{user?.username || 'user'}</div>
          </div>
        </div>
        <div className="header-right">
           <div className="header-balance">{user?.points} XP</div>
           <div onClick={() => {setShowNotif(!showNotif); fetch('/api/increase-points', {method:'POST', body:JSON.stringify({action:'read_notifs', telegramId:user.id})})}} className="notif-bell">
             🔔 {unread > 0 && <span className="red-dot"></span>}
           </div>
        </div>

        {showNotif && (
          <div className="notif-box">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
              <b>الإشعارات المستلمة</b>
              <span onClick={() => setShowNotif(false)}>✖</span>
            </div>
            {notifs.length === 0 ? <p style={{textAlign:'center', opacity:0.5}}>لا توجد رسائل</p> : notifs.map((n: any) => (
              <div key={n.id} className="notif-item">
                <img src={n.iconUrl} alt=""/>
                <div><b>{n.title}</b><p>{n.message}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tabs-container" style={{gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)'}}>
        <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'tab-button active' : 'tab-button'}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={activeTab === 'tasks' ? 'tab-button active' : 'tab-button'}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'tab-button active' : 'tab-button'}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'tab-button active' : 'tab-button'}>إدارة</button>}
      </div>

      <div className="content">
        {activeTab === 'products' && (
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" onClick={async () => {
                const tg = (window as any).Telegram.WebApp;
                if (user.points < p.price) return tg.showAlert('رصيدك غير كافٍ!');
                tg.showConfirm(`تأكيد طلب ${p.title}؟`, async (ok:any) => {
                  if(ok) {
                    const res = await adminDo({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title, first_name:user.first_name});
                    if(res.success) { setUser((prev:any)=>({...prev, points: res.newPoints})); tg.showAlert('تم الطلب!'); refreshData(); }
                  }
                })
              }}>
                <img src={p.imageUrl} className="product-image" alt=""/>
                <div className="p-info"><h3>{p.title}</h3><span>{p.price} XP</span></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={handlePointsUpdate} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.length === 0 ? <div className="empty-msg">لا توجد عمليات بعد</div> : history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div className="history-left">
                   <div className={`status-icon ${h.status}`}>{h.status === 'completed' ? '✅' : h.status === 'pending' ? '⏳' : '❌'}</div>
                   <div className="history-details">
                      <p className="history-desc">{h.description}</p>
                      <small className="history-date">{new Date(h.createdAt).toLocaleDateString()}</small>
                   </div>
                </div>
                <div className={`history-amount ${h.amount > 0 ? 'plus' : 'minus'}`}>{h.amount > 0 ? `+${h.amount}` : h.amount}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-section">
            <h4>📦 الطلبات المعلقة ({adminData.orders.length})</h4>
            {adminData.orders.map((o:any) => (
              <div key={o.id} className="admin-card">
                <div style={{fontSize:'12px'}}>ID:{o.telegramId}<br/>{o.description}</div>
                <div className="admin-btns" style={{display:'flex'}}>
                   <button className="btn-ok" onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'completed'})}>قبول</button>
                   <button className="btn-no" onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'rejected'})}>رفض</button>
                </div>
              </div>
            ))}
            <h4 style={{marginTop:'20px'}}>👤 إدارة الأعضاء ({adminData.users.length})</h4>
            {adminData.users.map((u:any) => (
              <div key={u.id} className="admin-user-row">
                <div style={{fontSize:'13px'}}>
                  <b>@{u.username || 'unknown'}</b><br/>
                  <span style={{color:'var(--secondary)'}}>الرصيد: {u.points} XP</span>
                </div>
                <div style={{display:'flex', gap:'4px'}}>
                   <button className="btn-blue" onClick={() => {const a=prompt('القيمة؟'); a && adminDo({action:'manage_points', telegramId:u.telegramId, amount:a}).then(r=>setUser((p:any)=>p.id===u.telegramId?({...p, points:r.points}):p))}}>💰</button>
                   <button className="btn-blue" onClick={() => {const t=prompt('العنوان'); const m=prompt('الرسالة'); t && adminDo({action:'send_notif', telegramId:u.telegramId, title:t, message:m})}}>🔔</button>
                   {u.status === 1 ? 
                     <button style={{background:'var(--success)', border:'none', borderRadius:'8px', color:'white'}} onClick={() => adminDo({action:'toggle_ban', telegramId:u.telegramId, status:'unban'})}>🔓</button>
                     :
                     <button className="btn-no" onClick={() => {const r=prompt('سبب الحظر؟'); r && adminDo({action:'toggle_ban', telegramId:u.telegramId, status:'ban', reason:r})}}>🚫</button>
                   }
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
