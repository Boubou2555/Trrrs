'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import './styles.css'

// تعريف الأنواع للمكون الديناميكي لمنع خطأ الـ Build
const Page1 = dynamic<{ onPointsUpdate: (pts: number) => void }>(
  () => import('./page1'), 
  { 
    ssr: false,
    loading: () => <div style={{padding: '20px', textAlign: 'center', color: '#6c5ce7'}}>جاري تحميل المهام...</div>
  }
)

const ADMIN_ID = 5149849049;

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks' | 'history' | 'admin'>('products')
  const [history, setHistory] = useState<any[]>([])
  const [notifs, setNotifs] = useState<any[]>([]) 
  const [showNotif, setShowNotif] = useState(false)
  const [adminData, setAdminData] = useState({ orders: [], users: [] })
  const [tabLoading, setTabLoading] = useState(false)

  const isFetching = useRef(false);

  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' | 'error') => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    }
  };

  const refreshData = useCallback(async (isInitial = false) => {
    if (!user?.id || user.isBanned || isFetching.current) return;
    if (isInitial) setTabLoading(true);
    
    isFetching.current = true;
    try {
      const res = await fetch(`/api/increase-points?telegramId=${user.id}`);
      const d = await res.json();
      
      if (d.success) {
        setHistory(d.history || []);
        setNotifs(d.notifs || []);
        setUser((prev: any) => prev ? { ...prev, points: d.points ?? prev.points } : null);
      }
    } catch (e) { 
      console.error("Refresh Error:", e);
    } finally { 
      isFetching.current = false;
      setTabLoading(false); 
    }
  }, [user?.id, user?.isBanned]);

  useEffect(() => {
    if (user?.id && !user.isBanned) {
      const interval = setInterval(refreshData, 8000); 
      return () => clearInterval(interval);
    }
  }, [user?.id, user?.isBanned, refreshData]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.expand(); 
    
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      fetch('/api/increase-points', { 
        method: 'POST', 
        body: JSON.stringify({...u, action: 'login_check'}) 
      })
      .then(r => r.json()).then(data => {
        setUser({ 
          ...u, 
          points: data.points || 0, 
          isBanned: data.user?.status === 1, 
          reason: data.user?.banReason 
        });
        setLoading(false);
      });
    } else { 
      setLoading(false); 
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') refreshData(true);
    if (activeTab === 'admin' && user?.id === ADMIN_ID) loadAdminData();
  }, [activeTab, user?.id, refreshData])

  const loadAdminData = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`/api/increase-points?adminId=${ADMIN_ID}`);
      const data = await res.json();
      setAdminData({ orders: data.orders || [], users: data.users || [] });
    } finally { setTabLoading(false); }
  }

  const adminDo = async (payload: any) => {
    try {
      const res = await fetch('/api/increase-points', { 
        method: 'POST', 
        body: JSON.stringify({ ...payload, adminId: ADMIN_ID }) 
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic('success');
        refreshData(); 
        if (activeTab === 'admin') loadAdminData();
      }
      return data;
    } catch (e) { console.error(e); }
  }

  const handleTabChange = (tab: any) => {
    if (activeTab !== tab) {
      triggerHaptic('light');
      setActiveTab(tab);
    }
  };

  if (loading) return <div className="loading-spinner"></div>
  
  if (user?.isBanned) return (
    <div className="main-container" style={{textAlign:'center', paddingTop:'100px'}}>
      <div style={{fontSize:'80px'}}>🚫</div>
      <h2 style={{color:'var(--danger)'}}>عذراً، أنت محظور!</h2>
      <p style={{marginTop:'15px'}}>السبب: {user.reason || "مخالفة القوانين"}</p>
    </div>
  )

  const unread = notifs.filter((n: any) => !n.isRead).length;

  return (
    <div className="main-container">
      <div className="user-header">
        <div className="header-left">
          <img src={user?.photo_url || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="user-avatar" alt="" />
          <div>
            <div style={{fontWeight:700, fontSize:'1rem'}}>{user?.first_name}</div>
            <div style={{fontSize:'0.7rem', opacity:0.6}}>@{user?.username || 'user'}</div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-balance">XP {user?.points}</div>
          <div className="notif-bell-wrapper" onClick={() => {
            triggerHaptic('medium');
            setShowNotif(true); 
            if(unread > 0) adminDo({action:'read_notifs', telegramId:user.id});
          }}>
            🔔 {unread > 0 && <span className="red-dot"></span>}
          </div>
        </div>
      </div>

      {showNotif && (
        <div className="notif-box">
          <div className="notif-header">
            <b>🔔 الإشعارات</b>
            <span onClick={() => setShowNotif(false)} style={{cursor:'pointer', fontSize:'1.2rem'}}>✖</span>
          </div>
          {notifs.length === 0 ? (
            <p style={{padding:'20px', textAlign:'center', opacity:0.5}}>لا توجد إشعارات حالياً</p>
          ) : notifs.map((n: any) => (
            <div key={n.id} className="notif-item">
              <img src={n.iconUrl || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="notif-img" alt="" />
              <div>
                <b>{n.title}</b>
                <p style={{fontSize:'0.8rem', opacity:0.7}}>{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs-container" style={{ display: 'grid', gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
        <button onClick={()=>handleTabChange('products')} className={activeTab==='products'?'tab-button active':'tab-button'}>المنتجات</button>
        <button onClick={()=>handleTabChange('tasks')} className={activeTab==='tasks'?'tab-button active':'tab-button'}>المهام</button>
        <button onClick={()=>handleTabChange('history')} className={activeTab==='history'?'tab-button active':'tab-button'}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={()=>handleTabChange('admin')} className={activeTab==='admin'?'tab-button active':'tab-button'}>إدارة</button>}
      </div>

      <div className="content">
        {activeTab === 'products' && (
          <div className="products-grid">
            {[
              { id: 1, title: "Coins Pes 130", price: 2500, img: "https://c2c.fp3.guinfra.com/file/6930febd0edd36f87c3190adEFDdxa6w03?fop=imageView/2/w/340/h/340" },
              { id: 2, title: "Diamonds FF 110", price: 2300, img: "https://cdn.bynogame.com/news/1675333606607.webp" },
              { id: 4, title: "DA Flexy 100", price: 2000, img: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png" }
            ].map(p => (
              <div key={p.id} className="product-card" onClick={() => {
                triggerHaptic('medium');
                const tg = (window as any).Telegram?.WebApp;
                if (user.points < p.price) return tg?.showAlert('رصيدك غير كافٍ لهذا المنتج!');
                tg?.showConfirm(`تأكيد طلب ${p.title}؟ سيتم خصم ${p.price} XP`, (ok:any) => {
                  if(ok) {
                    adminDo({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title});
                    tg?.showAlert('تم إرسال طلبك للإدارة بنجاح!');
                  }
                })
              }}>
                <img src={p.img} className="product-image" alt="" />
                <div style={{padding:'10px', textAlign:'center'}}>
                   <div style={{fontSize:'0.85rem', fontWeight:700, marginBottom:'4px'}}>{p.title}</div>
                   <div style={{color:'var(--primary-light)', fontSize:'0.85rem', fontWeight:'bold'}}>{p.price} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts: number) => setUser((prev: any) => ({ ...prev, points: pts }))} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {tabLoading ? (
                <div style={{textAlign:'center', padding:'20px', color:'var(--primary-light)'}}>جاري جلب البيانات...</div>
            ) : history.length === 0 ? (
                <p style={{textAlign:'center', opacity:0.5, marginTop:'20px'}}>لا توجد عمليات مسجلة</p>
            ) : history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                  <div style={{fontSize:'0.9rem', fontWeight:600}}>{h.description}</div>
                  <span className={`status-text status-${h.status || 'pending'}`}>
                    {h.status === 'completed' ? 'تم الإرسال ✅' : h.status === 'rejected' ? 'مرفوض ❌' : 'قيد المراجعة ⏳'}
                  </span>
                  <small style={{opacity:0.4, fontSize:'0.7rem'}}>{new Date(h.createdAt).toLocaleString('ar-EG')}</small>
                </div>
                <div style={{fontSize:'1rem', fontWeight:'bold'}} className={h.amount > 0 ? 'plus' : 'minus'}>
                  {h.amount > 0 ? `+${h.amount}` : h.amount} XP
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && user?.id === ADMIN_ID && (
          <div className="admin-section">
            {tabLoading ? (
                <div className="loading-spinner" style={{margin:'20px auto'}}></div>
            ) : (
              <>
                <h4 style={{margin:'10px 0', fontSize:'0.9rem'}}>📦 الطلبات الجديدة ({adminData.orders.length})</h4>
                {adminData.orders.length === 0 ? <p style={{opacity:0.5, fontSize:'0.8rem'}}>كل شيء نظيف! لا طلبات حالياً.</p> : adminData.orders.map((o:any) => (
                  <div key={o.id} className="admin-card">
                    <div style={{fontSize:'0.85rem', marginBottom:'10px'}}>
                      <b>👤 {o.user?.firstName} (@{o.user?.username})</b>
                      <div style={{marginTop:'5px', color:'var(--primary-light)'}}>🛒 {o.description}</div>
                    </div>
                    <div className="admin-btns">
                      <button className="btn-mini" style={{background:'var(--success)', flex:1}} onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'completed', telegramId: o.telegramId})}>قبول</button>
                      <button className="btn-mini" style={{background:'var(--danger)', flex:1}} onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'rejected', telegramId: o.telegramId})}>رفض</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
