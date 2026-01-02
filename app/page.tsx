'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import './styles.css'

const Page1 = dynamic(() => import('./page1'), { ssr: false })
const ADMIN_ID = 5149849049;

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')
  const [history, setHistory] = useState<any[]>([])
  const [notifs, setNotifs] = useState<any[]>([]) 
  const [showNotif, setShowNotif] = useState(false)
  const [adminData, setAdminData] = useState({ orders: [], users: [] })

  // دالة جلب البيانات وتحديث النقاط فوراً
  const refreshData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/increase-points?telegramId=${user.id}`);
      const d = await res.json();
      
      if (d.user?.status === 1) {
        setUser((prev: any) => ({ ...prev, isBanned: true, banReason: d.user.banReason }));
      } else {
        setHistory(d.history || []);
        setNotifs(d.notifs || []);
        // تحديث النقاط في الواجهة فوراً
        setUser((prev: any) => prev ? { ...prev, points: d.points ?? prev.points, isBanned: false } : null);
      }
    } catch (e) { console.error(e) }
  }, [user?.id])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({...u, action: 'login_check'}) })
      .then(r => r.json()).then(data => {
        setUser({ ...u, points: data.points || 0, isBanned: data.user?.status === 1, banReason: data.user?.banReason });
        setLoading(false);
      });
    } else { setLoading(false); }
  }, [])

  // تحديث تلقائي كل 10 ثوانٍ لضمان بقاء الرصيد محدثاً دائماً بدون رفرش
  useEffect(() => {
    if (user?.id) {
      refreshData();
      const interval = setInterval(refreshData, 10000); 
      return () => clearInterval(interval);
    }
  }, [refreshData, user?.id])

  useEffect(() => {
    if (activeTab === 'admin' && user?.id === ADMIN_ID) loadAdminData();
  }, [activeTab, user?.id])

  const loadAdminData = async () => {
    try {
      const res = await fetch(`/api/increase-points?adminId=${ADMIN_ID}`);
      const data = await res.json();
      setAdminData({ orders: data.orders || [], users: data.users || [] });
    } catch (e) { console.error(e) }
  }

  const adminAction = async (payload: any) => {
    const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...payload, adminId: ADMIN_ID }) });
    const data = await res.json();
    if (data.success) {
      await loadAdminData();
      await refreshData();
    }
    return data;
  }

  const handleOpenNotifs = () => {
    setShowNotif(true);
    if (notifs.some((n: any) => !n.isRead)) {
      adminAction({ action: 'read_notifs', telegramId: user.id });
      setNotifs((prev) => prev.map((n: any) => ({ ...n, isRead: true })));
    }
  }

  if (loading) return <div className="loading-spinner"></div>
  if (user?.isBanned) return (
    <div className="main-container" style={{textAlign:'center', paddingTop:'100px'}}>
      <h1 style={{color:'var(--danger)'}}>🚫 حسابك محظور</h1>
      <p style={{marginTop:'15px'}}>{user.banReason || "لقد تم حظرك لمخالفة القوانين"}</p>
    </div>
  )

  return (
    <div className="main-container">
      <div className="user-header">
        <div className="header-left">
          <img src={user?.photo_url || ''} className="user-avatar" alt="avatar" />
          <div>
            <div style={{fontWeight:700}}>{user?.first_name || 'GUEST'}</div>
            <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>@{user?.username || 'user'}</div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-balance">{user?.points || 0} XP</div>
          <div className="notif-bell-wrapper" onClick={handleOpenNotifs}>
            🔔 {notifs.some((n: any) => !n.isRead) && <span className="red-dot"></span>}
          </div>
        </div>
      </div>

      {showNotif && (
        <div className="notif-box">
          <div className="notif-header"><b>🔔 الإشعارات</b><span onClick={() => setShowNotif(false)} style={{cursor:'pointer', color:'var(--danger)'}}>✖</span></div>
          {notifs.length === 0 ? <p style={{padding:'20px', textAlign:'center'}}>لا توجد إشعارات</p> : notifs.map((n: any) => (
            <div key={n.id} className="notif-item">
              <img src={n.iconUrl || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="notif-img" alt="icon" />
              <div><b>{n.title}</b><p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{n.message}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* حل مشكلة الفراغ: نغير عدد الأعمدة بناءً على هوية المستخدم */}
      <div className="tabs-container" style={{ gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
        <button onClick={()=>setActiveTab('products')} className={activeTab==='products'?'tab-button active':'tab-button'}>المنتجات</button>
        <button onClick={()=>setActiveTab('tasks')} className={activeTab==='tasks'?'tab-button active':'tab-button'}>الهدية</button>
        <button onClick={()=>setActiveTab('history')} className={activeTab==='history'?'tab-button active':'tab-button'}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={()=>setActiveTab('admin')} className={activeTab==='admin'?'tab-button active':'tab-button'}>إدارة</button>}
      </div>

      <div className="content">
        {activeTab === 'products' && (
          <div className="products-grid">
            {[
              { id: 1, title: "جواهر 5000 اندرويد", price: 170, img: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png" },
              { id: 2, title: "جواهر 5000 ايفون", price: 170, img: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png" }
            ].map(p => (
              <div key={p.id} className="product-card" onClick={() => {
                const tg = (window as any).Telegram?.WebApp;
                if (user.points < p.price) return tg?.showAlert('نقاطك لا تكفي!');
                tg?.showConfirm(`شراء ${p.title}؟`, async (ok:any) => {
                  if(ok) {
                    await adminAction({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title, imageUrl: p.img});
                    tg?.showAlert('تم إرسال طلبك!');
                  }
                })
              }}>
                <img src={p.img} className="product-image" alt="p" />
                <div style={{padding:'10px', textAlign:'center'}}>
                   <div style={{fontSize:'0.85rem', fontWeight:700}}>{p.title}</div>
                   <div style={{color:'var(--primary-light)', fontSize:'0.8rem'}}>{p.price} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={refreshData} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <span className={`status-text status-${h.status || 'pending'}`}>
                    {h.status === 'completed' ? 'مكتمل' : h.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                  <div><div style={{fontSize:'0.9rem'}}>{h.description}</div><small style={{color:'var(--text-muted)'}}>{new Date(h.createdAt).toLocaleTimeString()}</small></div>
                </div>
                <div style={{fontWeight:'bold'}} className={h.amount > 0 ? 'plus' : 'minus'}>{h.amount > 0 ? `+${h.amount}` : h.amount} XP</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-section">
             {/* ... كود الإدارة كما هو ... */}
          </div>
        )}
      </div>
      <div style={{textAlign:'center', padding:'20px', color:'var(--text-muted)', fontSize:'0.7rem'}}>Developed By Borhane</div>
    </div>
  )
}
