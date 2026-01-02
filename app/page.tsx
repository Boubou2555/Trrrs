'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import './styles.css'

const Page1 = dynamic(() => import('./page1'), { ssr: false })
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

  // تحديث البيانات في الخلفية
  const refreshData = useCallback(async (isInitial = false) => {
    if (!user?.id || user.isBanned || isFetching.current) return;
    if (isInitial) setTabLoading(true);
    
    isFetching.current = true;
    try {
      const res = await fetch(`/api/increase-points?telegramId=${user.id}`);
      const d = await res.json();
      setHistory(d.history || []);
      setNotifs(d.notifs || []);
      setUser((prev: any) => prev ? { ...prev, points: d.points ?? prev.points } : null);
    } catch (e) { console.error(e) } finally { 
      isFetching.current = false;
      setTabLoading(false); 
    }
  }, [user?.id, user?.isBanned]);

  // التحديث التلقائي للنقطة الحمراء
  useEffect(() => {
    if (user?.id && !user.isBanned) {
      const interval = setInterval(refreshData, 4000);
      return () => clearInterval(interval);
    }
  }, [user?.id, user?.isBanned, refreshData]);

  // دخول المستخدم
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({...u, action: 'login_check'}) })
      .then(r => r.json()).then(data => {
        setUser({ ...u, points: data.points || 0, isBanned: data.user?.status === 1, reason: data.user?.banReason });
        setLoading(false);
      });
    } else { setLoading(false); }
  }, [])

  // جلب بيانات الإدارة
  useEffect(() => {
    if (activeTab === 'history') refreshData(true);
    if (activeTab === 'admin' && user?.id === ADMIN_ID) loadAdminData();
  }, [activeTab, user?.id, refreshData])

  const loadAdminData = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`/api/increase-points?adminId=${ADMIN_ID}`);
      const data = await res.json();
      // هنا نتوقع أن يرسل السيرفر orders تحتوي على كائن user مدمج
      setAdminData({ orders: data.orders || [], users: data.users || [] });
    } catch (e) { console.error(e) } finally { setTabLoading(false); }
  }

  const adminDo = async (payload: any) => {
    try {
      const res = await fetch('/api/increase-points', { method: 'POST', body: JSON.stringify({ ...payload, adminId: ADMIN_ID }) });
      const data = await res.json();
      if (data.success) {
        if (data.newPoints !== undefined) {
          setUser((prev: any) => ({ ...prev, points: data.newPoints }));
        }
        refreshData(); 
        if (activeTab === 'admin') loadAdminData();
      }
      return data;
    } catch (e) { console.error(e) }
  }

  const handlePointsUpdate = (newPoints: number) => {
    setUser((prev: any) => ({ ...prev, points: newPoints }));
    refreshData();
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
          <img src={user?.photo_url || ''} className="user-avatar" alt="" />
          <div>
            <div style={{fontWeight:700}}>{user?.first_name}</div>
            <div style={{fontSize:'0.7rem', opacity:0.6}}>@{user?.username}</div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-balance">{user?.points} XP</div>
          <div className="notif-bell-wrapper" onClick={() => {setShowNotif(true); if(unread > 0) adminDo({action:'read_notifs', telegramId:user.id});}}>
            🔔 {unread > 0 && <span className="red-dot"></span>}
          </div>
        </div>
      </div>

      {showNotif && (
        <div className="notif-box">
          <div className="notif-header"><b>🔔 الإشعارات</b><span onClick={() => setShowNotif(false)} style={{cursor:'pointer'}}>✖</span></div>
          {notifs.length === 0 ? <p style={{padding:'20px', textAlign:'center', opacity:0.5}}>لا توجد إشعارات</p> : notifs.map((n: any) => (
            <div key={n.id} className="notif-item">
              <img src={n.iconUrl || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="notif-img" alt="" />
              <div><b>{n.title}</b><p style={{fontSize:'0.8rem', opacity:0.7}}>{n.message}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs-container" style={{ display: 'grid', gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
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
              { id: 2, title: "جواهر 5000 ايفون", price: 170, img: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png" },
              { id: 4, title: "تحويل فليكسي", price: 50, img: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png" }
            ].map(p => (
              <div key={p.id} className="product-card" onClick={async () => {
                const tg = (window as any).Telegram?.WebApp;
                if (user.points < p.price) return tg?.showAlert('رصيدك غير كافٍ!');
                tg?.showConfirm(`تأكيد طلب ${p.title}؟`, async (ok:any) => {
                  if(ok) {
                    const res = await adminDo({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title});
                    if(res?.success) tg?.showAlert('تم الطلب!');
                  }
                })
              }}>
                <img src={p.img} className="product-image" alt="" />
                <div style={{padding:'10px', textAlign:'center'}}>
                   <div style={{fontSize:'0.85rem', fontWeight:700}}>{p.title}</div>
                   <div style={{color:'var(--primary-light)', fontSize:'0.8rem'}}>{p.price} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={handlePointsUpdate} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {tabLoading ? <div style={{textAlign:'center', padding:'20px', color:'#ffa500', fontWeight:'bold'}}>انتظر لحظة...</div> : 
             history.length === 0 ? <p style={{textAlign:'center', opacity:0.5}}>لا توجد عمليات</p> :
             history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <span className={`status-text status-${h.status || 'pending'}`}>
                    {h.status === 'completed' ? 'مكتمل' : h.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                  <div><div style={{fontSize:'0.9rem'}}>{h.description}</div><small style={{opacity:0.5}}>{new Date(h.createdAt).toLocaleDateString()}</small></div>
                </div>
                <div style={{fontWeight:'bold'}} className={h.amount > 0 ? 'plus' : 'minus'}>{h.amount > 0 ? `+${h.amount}` : h.amount} XP</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && user?.id === ADMIN_ID && (
          <div className="admin-section">
            {tabLoading ? <div style={{textAlign:'center', padding:'20px', color:'#ffa500', fontWeight:'bold'}}>انتظر لحظة...</div> : (
              <>
                <h4 style={{margin:'10px 0'}}>📦 الطلبات المعلقة ({adminData.orders.length})</h4>
                {adminData.orders.map((o:any) => (
                  <div key={o.id} className="admin-card">
                    <div style={{fontSize:'0.85rem', marginBottom:'10px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #ffffff10', paddingBottom:'5px', marginBottom:'5px'}}>
                        {/* هنا يتم العرض من قاعدة البيانات مباشرة */}
                        <span>👤 <b>{o.user?.firstName || 'بدون اسم'}</b></span>
                        <span style={{color:'#ffa500', fontWeight:'bold'}}>@{o.user?.username || 'no_user'}</span>
                      </div>
                      <div style={{opacity:0.6, fontSize:'0.75rem'}}>🆔 ID: {o.telegramId}</div>
                      <div style={{marginTop:'5px'}}>🛍️ {o.description}</div>
                    </div>
                    
                    <div className="admin-btns">
                      <button className="btn-mini" style={{background:'var(--success)', flex:1}} onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'completed', telegramId: o.telegramId})}>قبول</button>
                      <button className="btn-mini" style={{background:'var(--danger)', flex:1}} onClick={() => adminDo({action:'update_order', transactionId:o.id, status:'rejected', telegramId: o.telegramId})}>رفض</button>
                    </div>
                  </div>
                ))}
                
                <h4 style={{margin:'20px 0 10px 0'}}>👥 قائمة الأعضاء</h4>
                <div className="admin-card">
                  {adminData.users.map((u:any) => (
                    <div key={u.id} className="user-row">
                      <div><b>{u.firstName}</b><br/><small style={{color:'#ffa500'}}>@{u.username || 'unknown'}</small></div>
                      <div className="admin-btns">
                        <button className="btn-mini" style={{background:'var(--success)'}} onClick={() => {const a=prompt('القيمة؟'); a && adminDo({action:'manage_points', telegramId:u.telegramId, amount:a})}}>💰</button>
                        <button className="btn-mini" style={{background:'var(--primary)'}} onClick={() => {const t=prompt('العنوان'); const m=prompt('الرسالة'); t && m && adminDo({action:'send_notif', telegramId:u.telegramId, title:t, message:m})}}>🔔</button>
                        <button className="btn-mini" style={{background: u.status === 1 ? 'gray' : 'red'}} onClick={() => {
                          const st = u.status === 1 ? 'unban' : 'ban';
                          const re = st === 'ban' ? prompt('السبب؟') : "";
                          adminDo({action:'toggle_ban', telegramId:u.telegramId, status: st, reason: re});
                        }}>{u.status === 1 ? '🔓' : '🚫'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div style={{textAlign:'center', padding:'20px', opacity:0.5, fontSize:'0.7rem'}}>Developed By Borhane</div>
    </div>
  )
}
