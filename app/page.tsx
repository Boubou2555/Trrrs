'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'

// استيراد صفحة المهام بشكل ديناميكي
const Page1 = dynamic(() => import('./page1'), { 
  ssr: false,
  loading: () => <div style={{padding: '20px', textAlign: 'center', color: '#6c5ce7'}}>جاري تحميل المهام...</div>
})

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

  // وظيفة الاهتزاز الموحدة
  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning') => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (type === 'light') tg.HapticFeedback.impactOccurred('light');
      else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
      else if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
      else if (type === 'warning') tg.HapticFeedback.notificationOccurred('warning');
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
      const interval = setInterval(refreshData, 10000); // زيادة المدة لـ 10 ثوانٍ لتوفير السيرفر
      return () => clearInterval(interval);
    }
  }, [user?.id, user?.isBanned, refreshData]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.expand(); // تمديد التطبيق ليملأ الشاشة
    
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

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  
  if (user?.isBanned) return (
    <div className="ban-screen">
      <div className="ban-icon">🚫</div>
      <h2>حسابك محظور</h2>
      <p>السبب: {user.reason || "مخالفة سياسة الاستخدام"}</p>
    </div>
  )

  const unread = notifs.filter((n: any) => !n.isRead).length;

  return (
    <div className="app-wrapper">
      <style>{`
        :root {
          --p: #6c5ce7;
          --bg: #0a0a0a;
          --card: rgba(255,255,255,0.05);
        }
        .app-wrapper { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: white; min-height: 100vh; background: var(--bg); padding-bottom: 30px; }
        .user-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px); sticky; top: 0; z-index: 100; }
        .balance-pill { background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 6px 15px; borderRadius: 20px; fontWeight: bold; fontSize: 0.9rem; boxShadow: 0 4px 15px rgba(108, 92, 231, 0.3); }
        .red-dot { width: 8px; height: 8px; background: #ff4757; borderRadius: 50%; position: absolute; top: -2px; right: -2px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        .tabs-nav { display: flex; margin: 15px; background: var(--card); borderRadius: 15px; padding: 5px; gap: 5px; }
        .tab-btn { flex: 1; border: none; background: transparent; color: #888; padding: 10px; borderRadius: 12px; fontWeight: 600; transition: 0.3s; fontSize: 0.85rem; }
        .tab-btn.active { background: #6c5ce7; color: white; boxShadow: 0 4px 10px rgba(108, 92, 231, 0.2); }
        .product-card { background: var(--card); borderRadius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); transition: 0.2s; }
        .product-card:active { transform: scale(0.96); }
        .product-img { width: 100%; aspect-ratio: 1; object-fit: cover; }
        .history-item { background: var(--card); margin: 10px; padding: 15px; borderRadius: 15px; display: flex; justify-content: space-between; align-items: center; border-right: 4px solid #6c5ce7; }
        .status-badge { font-size: 0.7rem; padding: 3px 8px; borderRadius: 5px; background: rgba(255,255,255,0.1); }
      `}</style>

      {/* Header */}
      <div className="user-header">
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <img src={user?.photo_url || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} style={{width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #6c5ce7'}} alt="" />
          <div>
            <div style={{fontSize:'0.9rem', fontWeight:700}}>{user?.first_name}</div>
            <div style={{fontSize:'0.7rem', opacity:0.5}}>@{user?.username || 'user'}</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <div className="balance-pill">{user?.points} XP</div>
          <div style={{position:'relative', fontSize:'1.4rem'}} onClick={() => { setShowNotif(true); triggerHaptic('medium'); if(unread > 0) adminDo({action:'read_notifs', telegramId:user.id}); }}>
            🔔 {unread > 0 && <span className="red-dot"></span>}
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      {showNotif && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
          <div style={{background:'#1a1a1a', width:'100%', borderRadius:'25px', padding:'20px', maxHeight:'70vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <b>الإشعارات</b>
              <span onClick={()=>setShowNotif(false)} style={{cursor:'pointer'}}>✕</span>
            </div>
            {notifs.map((n:any) => (
              <div key={n.id} style={{display:'flex', gap:'10px', padding:'10px 0', borderBottom:'1px solid #333'}}>
                <div style={{fontSize:'1.5rem'}}>📩</div>
                <div>
                  <div style={{fontSize:'0.9rem', fontWeight:600}}>{n.title}</div>
                  <div style={{fontSize:'0.8rem', opacity:0.7}}>{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs-nav">
        <button onClick={()=>handleTabChange('products')} className={`tab-btn ${activeTab==='products'?'active':''}`}>المنتجات</button>
        <button onClick={()=>handleTabChange('tasks')} className={`tab-btn ${activeTab==='tasks'?'active':''}`}>المهام</button>
        <button onClick={()=>handleTabChange('history')} className={`tab-btn ${activeTab==='history'?'active':''}`}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={()=>handleTabChange('admin')} className={`tab-btn ${activeTab==='admin'?'active':''}`}>الإدارة</button>}
      </div>

      {/* Content Area */}
      <div style={{padding:'0 15px'}}>
        {activeTab === 'products' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
            {[
              { id: 1, title: "130 Coins Pes", price: 2500, img: "https://c2c.fp3.guinfra.com/file/6930febd0edd36f87c3190adEFDdxa6w03?fop=imageView/2/w/340/h/340" },
              { id: 2, title: "110 Diamonds FF", price: 2300, img: "https://cdn.bynogame.com/news/1675333606607.webp" },
              { id: 4, title: "100 DA Flexy", price: 2000, img: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png" }
            ].map(p => (
              <div key={p.id} className="product-card" onClick={() => {
                triggerHaptic('medium');
                const tg = (window as any).Telegram?.WebApp;
                if(user.points < p.price) return tg?.showAlert('رصيدك لا يكفي!');
                tg?.showConfirm(`هل تريد شراء ${p.title} مقابل ${p.price} XP؟`, (ok:any)=>{
                  if(ok) adminDo({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title});
                })
              }}>
                <img src={p.img} className="product-img" alt="" />
                <div style={{padding:'12px'}}>
                  <div style={{fontSize:'0.8rem', fontWeight:600, marginBottom:'5px'}}>{p.title}</div>
                  <div style={{color:'#a29bfe', fontSize:'0.85rem', fontWeight:700}}>{p.price} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts)=>setUser((p:any)=>({...p, points:pts}))} />}

        {activeTab === 'history' && (
          <div>
            {tabLoading ? <div style={{textAlign:'center', marginTop:'20px'}}>جاري التحديث...</div> : history.map((h:any)=>(
              <div key={h.id} className="history-item">
                <div>
                  <div style={{fontSize:'0.85rem', fontWeight:600}}>{h.description}</div>
                  <div className="status-badge">{h.status === 'completed' ? '✅ مكتمل' : '⏳ قيد الانتظار'}</div>
                </div>
                <div style={{color: h.amount > 0 ? '#2ecc71' : '#ff4757', fontWeight:800}}>
                  {h.amount > 0 ? `+${h.amount}` : h.amount}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && user?.id === ADMIN_ID && (
          <div style={{background:'#1a1a1a', borderRadius:'20px', padding:'15px'}}>
             <h3 style={{fontSize:'1rem', marginBottom:'15px'}}>📦 طلبات المستخدمين</h3>
             {adminData.orders.map((o:any) => (
               <div key={o.id} style={{background:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'15px', marginBottom:'10px'}}>
                  <div style={{fontSize:'0.8rem'}}>👤 {o.user?.firstName} (@{o.user?.username})</div>
                  <div style={{fontSize:'0.85rem', margin:'5px 0', color:'#6c5ce7'}}>🛍️ {o.description}</div>
                  <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                    <button style={{flex:1, background:'#2ecc71', border:'none', color:'white', padding:'8px', borderRadius:'8px'}} onClick={()=>adminDo({action:'update_order', transactionId:o.id, status:'completed', telegramId:o.telegramId})}>قبول</button>
                    <button style={{flex:1, background:'#ff4757', border:'none', color:'white', padding:'8px', borderRadius:'8px'}} onClick={()=>adminDo({action:'update_order', transactionId:o.id, status:'rejected', telegramId:o.telegramId})}>رفض</button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <div style={{textAlign:'center', marginTop:'40px', opacity:0.3, fontSize:'0.7rem'}}>
        BORHANE MINI APP v2.0
      </div>
    </div>
  )
}
