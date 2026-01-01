
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
  const [notifs, setNotifs] = useState<any[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const [adminData, setAdminData] = useState({ orders: [] as any[], users: [] as any[] })

  const products = [
    { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png" },
    { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png" },
    { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png" }
  ];

  // دالة جلب البيانات الأساسية عند الدخول
  const fetchData = useCallback(async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({...tgUser, action: 'login_check'}) })
      const data = await res.json()
      if (data.banned) {
        setUser({ ...tgUser, isBanned: true, reason: data.reason });
      } else {
        setUser({ ...tgUser, points: data.points || 0, isBanned: false });
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  // دالة جلب الإشعارات والسجل (بدون مؤقت تلقائي مزعج للنقطة)
  const refreshData = useCallback(async () => {
    if (!user?.id || user.isBanned) return;
    const res = await fetch(`/api/increase-points?telegramId=${user.id}`);
    const d = await res.json();
    setHistory(d.history || []);
    setNotifs(d.notifs || []);
  }, [user?.id, user?.isBanned])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) { 
      tg.ready();
      fetchData(tg.initDataUnsafe.user);
    }
  }, [fetchData])

  // تحديث البيانات عند تغيير التبويب فقط (كما طلبت - النظام الأول)
  useEffect(() => {
    refreshData();
  }, [activeTab, refreshData])

  useEffect(() => {
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders || [], users: d.users || [] }))
    }
  }, [activeTab])

  // قراءة الإشعارات
  const handleReadNotifs = async () => {
    setShowNotif(!showNotif);
    if (!showNotif) {
      // إرسال أمر القراءة للسيرفر
      await fetch('/api/increase-points', {method:'POST', body:JSON.stringify({action:'read_notifs', telegramId:user.id})});
      // تحديث الحالة محلياً لتختفي النقطة فوراً
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  }

  const adminDo = async (p: any) => {
    const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...p, adminId: ADMIN_ID }) });
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminData({ orders: d.orders || [], users: d.users || [] }));
    }
    return await res.json();
  }

  if (user?.isBanned) return <div className="banned-screen">🚫<h2>أنت محظور</h2><p>السبب: {user.reason}</p></div>
  if (loading) return <div className="loading-spinner"></div>

  // النقطة تظهر فقط إذا كانت هناك رسالة isRead فيها false
  const hasUnread = notifs.some(n => n.isRead === false);

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
           <div onClick={handleReadNotifs} className="notif-bell" style={{position:'relative', cursor:'pointer'}}>
             🔔 {hasUnread && <span className="red-dot"></span>}
           </div>
        </div>

        {showNotif && (
          <div className="notif-box">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
              <b>الرسائل</b>
              <span onClick={() => setShowNotif(false)}>✖</span>
            </div>
            {notifs.length === 0 ? <p style={{textAlign:'center', opacity:0.5}}>لا توجد رسائل</p> : notifs.map((n: any) => (
              <div key={n.id} className="notif-item">
                <img src={n.iconUrl} alt="" width="25"/>
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
                    const res = await adminDo({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title});
                    if(res.success) { 
                       setUser((prev:any)=>({...prev, points: res.newPoints})); 
                       tg.showAlert('تم الطلب!'); 
                       refreshData(); 
                    }
                  }
                })
              }}>
                <img src={p.imageUrl} className="product-image" alt=""/>
                <div className="p-info"><h3>{p.title}</h3><span>{p.price} XP</span></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts:any) => { setUser((u:any)=>({...u, points:pts})); refreshData(); }} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div className="history-left">
                   <div className={`status-icon ${h.status}`}>{h.status === 'completed' ? '✅' : h.status === 'pending' ? '⏳' : '❌'}</div>
                   <div className="history-details"><p>{h.description}</p></div>
                </div>
                <div className={`history-amount ${h.amount > 0 ? 'plus' : 'minus'}`}>{h.amount > 0 ? `+${h.amount}` : h.amount}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-section">
            <h4>📦 طلبات الشراء ({adminData.orders.length})</h4>
            {adminData.orders.map((o:any) => {
              const orderUser = adminData.users.find((u: any) => u.telegramId === o.telegramId);
              return (
                <div key={o.id} className="admin-card">
                  <div style={{width:'100%', display:'flex', justifyContent:'space-between'}}>
                     <div style={{fontSize:'12px'}}><b>{o.description}</b><br/>@{orderUser?.username || 'user'}</div>
                     <a href={orderUser?.username ? `https://t.me/${orderUser.username}` : `tg://user?id=${o.telegramId}`} target="_blank" style={{textDecoration:'none', background:'var(--primary)', color:'white', padding:'5px 10px', borderRadius:'8px', fontSize:'11px'}}>💬 تواصل</a>
                  </div>
                  <div className="admin-btns" style={{width:'100%', display:'flex', gap:'5px', marginTop:'10px'}}>
                     <button className="btn-ok" style={{flex:1}} onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'completed'})}>قبول</button>
                     <button className="btn-no" style={{flex:1}} onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'rejected'})}>رفض</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
