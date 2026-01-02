'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import './styles.css'

const Page1 = dynamic(() => import('./page1'), { ssr: false })
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
    if (activeTab === 'admin' && user?.id === ADMIN_ID) {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders, users: d.users }))
    }
  }, [activeTab, refreshData, user?.id])

  const adminDo = async (p: any) => {
    const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...p, adminId: ADMIN_ID }) });
    const data = await res.json();
    fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders, users: d.users }))
    return data;
  }

  const handlePointsUpdate = (newPoints: number) => {
    setUser((prev: any) => ({ ...prev, points: newPoints }));
    refreshData();
  };

  if (user?.isBanned) return (
    <div className="banned-screen"><h2>🚫 محظور</h2><p>السبب: {user.reason}</p></div>
  )

  if (loading) return <div className="loading-spinner"></div>

  return (
    <div className="main-container">
      {/* الهيدر */}
      <div className="user-header">
        <div className="header-left">
          <img src={user?.photo_url || ''} className="user-avatar" alt="" />
          <div className="user-info">
            <div className="user-name">{user?.first_name}</div>
            <div className="user-username">@{user?.username}</div>
          </div>
        </div>
        <div className="header-right">
           <div className="header-balance">{user?.points} XP</div>
           <div onClick={() => setShowNotif(!showNotif)} className="notif-bell">
             🔔 {notifs.filter((n: any) => !n.isRead).length > 0 && <span className="red-dot"></span>}
           </div>
        </div>
      </div>

      {/* نافذة الإشعارات */}
      {showNotif && (
        <div className="notif-box">
          <div><b>🔔 الإشعارات</b> <span onClick={() => {setShowNotif(false); adminDo({action:'read_notifs', telegramId:user.id})}}>✖</span></div>
          {notifs.length === 0 ? <p style={{textAlign:'center', padding:'20px'}}>لا توجد إشعارات</p> : notifs.map((n: any) => (
            <div key={n.id} className="notif-item">
              <div><b>{n.title}</b><p>{n.message}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs-container">
        <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'tab-button active' : 'tab-button'}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={activeTab === 'tasks' ? 'tab-button active' : 'tab-button'}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'tab-button active' : 'tab-button'}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'tab-button active' : 'tab-button'}>إدارة</button>}
      </div>

      <div className="content">
        {activeTab === 'products' && (
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" onClick={() => {
                const tg = (window as any).Telegram.WebApp;
                if (user.points < p.price) return tg.showAlert('رصيدك غير كافٍ!');
                tg.showConfirm(`تأكيد طلب ${p.title}؟`, async (ok:any) => {
                  if(ok) {
                    const res = await adminDo({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title});
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

        {activeTab === 'admin' && (
          <div className="admin-section">
            <h4 style={{marginBottom:'15px'}}>📦 الطلبات ({adminData.orders.length})</h4>
            {adminData.orders.map((o:any) => (
              <div key={o.id} className="admin-card">
                <p>ID: {o.telegramId} - {o.description}</p>
                <div className="admin-btns">
                  <button className="btn-ok" onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'completed'})}>قبول</button>
                  <button className="btn-no" onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'rejected'})}>رفض</button>
                </div>
              </div>
            ))}

            <h4 style={{margin:'20px 0 10px'}}>👥 قائمة الأعضاء</h4>
            {adminData.users.map((u:any) => (
              <div key={u.id} className="admin-user-row" style={{background:'var(--bg-card)', padding:'10px', borderRadius:'10px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'14px'}}>{u.firstName}</div>
                  <div style={{fontSize:'12px', color:'var(--primary)'}}>{u.points} XP</div>
                </div>
                <div className="admin-btns">
                  <button className="btn-ok" style={{padding:'5px 8px', fontSize:'10px'}} onClick={() => {
                    const val = prompt('ادخل المبلغ (موجب للزيادة، سالب للخصم):');
                    if(val) adminDo({action:'manage_points', telegramId:u.telegramId, amount:val});
                  }}>💰</button>
                  <button className="btn-no" style={{padding:'5px 8px', fontSize:'10px'}} onClick={() => {
                    const reason = prompt('سبب الحظر:');
                    if(reason) adminDo({action:'toggle_ban', telegramId:u.telegramId, status:'ban', reason});
                  }}>🚫</button>
                  <button style={{padding:'5px 8px', fontSize:'10px', background:'var(--primary)'}} onClick={() => {
                    const msg = prompt('نص الإشعار:');
                    if(msg) adminDo({action:'send_notif', telegramId:u.telegramId, title:'رسالة من الإدارة', message:msg});
                  }}>🔔</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
