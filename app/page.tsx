'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'

const ADMIN_ID = 5149849049; //

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')
  const [history, setHistory] = useState([])
  const [notifs, setNotifs] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [adminData, setAdminData] = useState({ orders: [], users: [] })

  const refreshData = useCallback(() => {
    if (!user?.id) return;
    fetch(`/api/increase-points?telegramId=${user.id}`).then(r => r.json()).then(d => {
      setHistory(d.history || []);
      setNotifs(d.notifs || []);
    })
  }, [user?.id])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      fetch('/api/increase-points', { 
        method: 'POST', 
        body: JSON.stringify({...u, action: 'login_check'}) 
      }).then(r => r.json()).then(data => {
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
    const res = await fetch('/api/increase-points', { 
      method: 'POST', 
      body: JSON.stringify({ ...payload, adminId: ADMIN_ID }) 
    });
    const data = await res.json();
    if (data.success) loadAdminData();
    return data;
  }

  if (loading) return <div className="loading-spinner"></div>

  return (
    <div className="main-container">
      {/* الهيدر */}
      <div className="user-header">
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={user?.photo_url} className="user-avatar" />
          <b>{user?.first_name}</b>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div className="header-balance">{user?.points} XP</div>
          <div onClick={() => setShowNotif(!showNotif)} style={{fontSize:'1.5rem', cursor:'pointer'}}>
            🔔 {notifs.some((n:any)=>!n.isRead) && "🔴"}
          </div>
        </div>
      </div>

      {/* الإشعارات - الصورة من iconUrl */}
      {showNotif && (
        <div className="notif-box">
          <div style={{padding:'15px', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between'}}>
            <b>🔔 الإشعارات</b>
            <span onClick={() => setShowNotif(false)}>✖</span>
          </div>
          {notifs.map((n: any) => (
            <div key={n.id} className="notif-item">
              {/* جلب الصورة من iconUrl كما في موديل Prisma */}
              <img src={n.iconUrl || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="notif-img" /> 
              <div>
                <b>{n.title}</b>
                <p style={{fontSize:'0.8rem', color:'#aaa'}}>{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* التبويبات */}
      <div className="tabs-container">
        <button onClick={()=>setActiveTab('products')} className={activeTab==='products'?'tab-button active':'tab-button'}>المنتجات</button>
        <button onClick={()=>setActiveTab('history')} className={activeTab==='history'?'tab-button active':'tab-button'}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={()=>setActiveTab('admin')} className={activeTab==='admin'?'tab-button active':'tab-button'}>إدارة</button>}
      </div>

      {/* السجل - نصوص ملونة */}
      {activeTab === 'history' && (
        <div className="history-list">
          {history.map((h: any) => (
            <div key={h.id} className="history-item">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span className={`status-text status-${h.status}`}>
                  {h.status === 'completed' ? 'مكتمل' : h.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                </span>
                <div>
                  <p className="history-desc">{h.description}</p>
                  <small className="history-date">{new Date(h.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
              <b className={h.amount > 0 ? 'plus' : 'minus'}>{h.amount} XP</b>
            </div>
          ))}
        </div>
      )}

      {/* لوحة الإدارة - اسم المستخدم وأزرار نصية */}
      {activeTab === 'admin' && (
        <div className="admin-section">
          <h4 style={{margin:'15px 0'}}>📦 الطلبات المعلقة</h4>
          {adminData.orders.map((o:any) => (
            <div key={o.id} className="admin-card">
              <div className="admin-order-header">
                <div>
                  {/* عرض الـ username لتعرفه بسهولة كما طلبت */}
                  <span className="admin-username">👤 المستخدم: @{o.user?.username || o.telegramId}</span>
                  <p>{o.description}</p>
                </div>
              </div>
              <div className="admin-btns">
                <button className="btn-action btn-accept" onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'completed'})}>قبول</button>
                <button className="btn-action btn-reject" onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'rejected'})}>رفض</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
