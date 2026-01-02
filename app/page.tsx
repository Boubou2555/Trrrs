'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

  // استخدام useRef لتجنب مشاكل التكرار في طلبات الشبكة
  const isFetching = useRef(false);

  // 1. دالة التحديث اللحظي (الرصيد + الإشعارات + السجل)
  const refreshData = useCallback(async () => {
    if (!user?.id || isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(`/api/increase-points?telegramId=${user.id}`);
      const d = await res.json();
      
      if (d.user?.status === 1) {
        setUser((prev: any) => ({ ...prev, isBanned: true, banReason: d.user.banReason }));
      } else {
        // تحديث السجل والإشعارات
        setHistory(d.history || []);
        setNotifs(d.notifs || []);
        
        // تحديث الرصيد فوراً في الواجهة عند حدوث أي تغيير في قاعدة البيانات
        setUser((prev: any) => {
            if (!prev) return null;
            if (prev.points !== d.points) {
                return { ...prev, points: d.points, isBanned: false };
            }
            return prev;
        });
      }
    } catch (e) { 
        console.error("Polling error:", e);
    } finally {
        isFetching.current = false;
    }
  }, [user?.id]);

  // 2. إعداد التحديث التلقائي كل 3 ثوانٍ (لإظهار النقطة الحمراء وتحديث الرصيد فوراً)
  useEffect(() => {
    if (user?.id) {
      refreshData(); // تحديث فوري عند التحميل
      const interval = setInterval(refreshData, 3000); // فحص كل 3 ثوانٍ
      return () => clearInterval(interval);
    }
  }, [user?.id, refreshData]);

  // تحميل البيانات الأولية عند فتح التطبيق
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

  // 3. دالة الأكشن: تقوم بالتحديث فوراً بعد الشراء أو الخصم دون انتظار الـ 3 ثوانٍ
  const adminAction = async (payload: any) => {
    try {
      const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...payload, adminId: ADMIN_ID }) });
      const data = await res.json();
      if (data.success) {
        await refreshData(); // تحديث الرصيد فوراً بعد العملية
        if (user?.id === ADMIN_ID) await loadAdminData();
      }
      return data;
    } catch (e) { console.error(e); }
  }

  const handleOpenNotifs = () => {
    setShowNotif(true);
    // إذا وجد إشعار غير مقروء، نرسل طلب تحديث الحالة "مقروء"
    if (notifs.some((n: any) => !n.isRead)) {
      adminAction({ action: 'read_notifs', telegramId: user.id });
      setNotifs((prev) => prev.map((n: any) => ({ ...n, isRead: true })));
    }
  }

  if (loading) return <div className="loading-spinner"></div>
  if (user?.isBanned) return (
    <div className="main-container" style={{textAlign:'center', paddingTop:'100px'}}>
      <h1 style={{color:'var(--danger)'}}>🚫 حسابك محظور</h1>
      <p style={{marginTop:'15px', fontSize:'1.1rem'}}>{user.banReason || "لقد تم حظرك لمخالفة القوانين"}</p>
    </div>
  )

  return (
    <div className="main-container">
      {/* الهيدر */}
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
            🔔 
            {/* النقطة الحمراء ستظهر فوراً بمجرد وصول إشعار جديد في قاعدة البيانات */}
            {notifs.some((n: any) => !n.isRead) && <span className="red-dot"></span>}
          </div>
        </div>
      </div>

      {showNotif && (
        <div className="notif-box">
          <div className="notif-header">
            <b>🔔 الإشعارات</b>
            <span onClick={() => setShowNotif(false)} style={{cursor:'pointer', color:'var(--danger)', padding:'5px'}}>✖</span>
          </div>
          {notifs.length === 0 ? (
            <p style={{padding:'20px', textAlign:'center', color:'var(--text-muted)'}}>لا توجد إشعارات</p>
          ) : (
            notifs.map((n: any) => (
              <div key={n.id} className="notif-item">
                <img src={n.iconUrl || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="notif-img" alt="icon" />
                <div>
                  <b style={{fontSize:'0.9rem'}}>{n.title}</b>
                  <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* التبويبات مع إخفاء الفراغ */}
      <div className="tabs-container" style={{ display: 'grid', gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
        <button onClick={()=>setActiveTab('products')} className={activeTab==='products'?'tab-button active':'tab-button'}>المنتجات</button>
        <button onClick={()=>setActiveTab('tasks')} className={activeTab==='tasks'?'tab-button active':'tab-button'}>الهدية</button>
        <button onClick={()=>setActiveTab('history')} className={activeTab==='history'?'tab-button active':'tab-button'}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={()=>setActiveTab('admin')} className={activeTab==='admin'?'tab-button active':'tab-button'}>إدارة</button>}
      </div>

      <div className="content">
        {activeTab === 'products' && (
           <div className="products-grid">
             {/* ... كود المنتجات كما هو ... */}
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

        {activeTab === 'admin' && user?.id === ADMIN_ID && (
          <div className="admin-section">
             {/* ... كود الإدارة كما هو ... */}
          </div>
        )}
      </div>
    </div>
  )
}
