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
  const [history, setHistory] = useState([])
  const [notifs, setNotifs] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [adminData, setAdminData] = useState({ orders: [], users: [] })

  const refreshData = useCallback(async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/increase-points?telegramId=${user.id}`);
    const d = await res.json();
    setHistory(d.history || []);
    setNotifs(d.notifs || []);
    setUser((prev: any) => prev ? { ...prev, points: d.points ?? prev.points } : null);
  }, [user?.id])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({...u, action: 'login_check'}) })
        .then(r => r.json()).then(data => {
          setUser({ ...u, points: data.points || 0 });
          setLoading(false);
        });
    }
  }, [])

  useEffect(() => {
    refreshData();
    if (activeTab === 'admin' && user?.id === ADMIN_ID) loadAdminData();
  }, [activeTab, refreshData, user?.id])

  const loadAdminData = async () => {
    const res = await fetch(`/api/increase-points?adminId=${ADMIN_ID}`);
    const data = await res.json();
    setAdminData({ orders: data.orders || [], users: data.users || [] });
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

  // دالة فتح الإشعارات واعتبارها مقروءة
  const handleOpenNotifs = () => {
    setShowNotif(true);
    if (notifs.some((n: any) => !n.isRead)) {
      adminAction({ action: 'read_notifs', telegramId: user.id });
      // تحديث الحالة محلياً فوراً لتختفي النقطة
      setNotifs(prev => prev.map((n: any) => ({ ...n, isRead: true })));
    }
  }

  if (loading) return <div className="loading-spinner"></div>

  return (
    <div className="main-container">
      {/* الهيدر مع النقطة الحمراء والأنيميشن */}
      <div className="user-header">
        <div className="header-left">
          <img src={user?.photo_url} className="user-avatar" />
          <div>
            <div style={{fontWeight:700}}>{user?.first_name}</div>
            <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>@{user?.username}</div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-balance">{user?.points} XP</div>
          <div className="notif-bell-wrapper" onClick={handleOpenNotifs}>
            🔔 {notifs.some((n: any) => !n.isRead) && <span className="red-dot"></span>}
          </div>
        </div>
      </div>

      {/* نافذة الإشعارات */}
      {showNotif && (
        <div className="notif-box">
          <div className="notif-header">
            <b>🔔 الإشعارات</b>
            <span onClick={() => setShowNotif(false)} style={{cursor:'pointer', color:'var(--danger)', padding:'5px'}}>✖</span>
          </div>
          {notifs.length === 0 ? <p style={{padding:'20px', textAlign:'center', color:'var(--text-muted)'}}>لا توجد إشعارات</p> : notifs.map((n: any) => (
            <div key={n.id} className="notif-item">
              <img src={n.iconUrl || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="notif-img" />
              <div><b>{n.title}</b><p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{n.message}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* التبويبات */}
      <div className="tabs-container">
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
                const tg = (window as any).Telegram.WebApp;
                if (user.points < p.price) return tg.showAlert('نقاطك لا
