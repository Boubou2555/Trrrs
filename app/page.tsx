'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import './styles.css'

// استيراد صفحة الهدية
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

  const products = [
    { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png" },
    { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png" },
    { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png" }
  ];

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
    if (data.success) loadAdminData();
    return data;
  }

  if (loading) return <div className="loading-spinner"></div>

  return (
    <div className="main-container">
      {/* 1. الهيدر الكامل مع الرصيد واسم المستخدم */}
      <div className="user-header">
        <div className="header-left">
          <img src={user?.photo_url} className="user-avatar" />
          <div className="user-info-text">
            <span className="user-name">{user?.first_name}</span>
            <span className="user-username">@{user?.username}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="header-balance">{user?.points} XP</div>
          <div onClick={() => setShowNotif(!showNotif)} style={{fontSize:'1.4rem', cursor:'pointer', position:'relative'}}>
            🔔 {notifs.some((n:any)=>!n.isRead) && <span style={{position:'absolute', top:0, right:0, width:8, height:8, background:'red', borderRadius:'50%'}}></span>}
          </div>
        </div>
      </div>

      {/* 2. الإشعارات مع صورة iconUrl الدائرية */}
      {showNotif && (
        <div className="notif-box">
          <div className="notif-header">
            <b>🔔 الإشعارات</b>
            <span onClick={() => setShowNotif(false)} style={{cursor:'pointer', color:'var(--danger)'}}>✖</span>
          </div>
          {notifs.length === 0 ? <p style={{padding:'20px', textAlign:'center', color:'var(--text-muted)'}}>لا توجد إشعارات</p> : notifs.map((n: any) => (
            <div key={n.id} className="notif-item">
              <img src={n.iconUrl || 'https://i.postimg.cc/zv3hrNct/1765456939666.jpg'} className="notif-img" />
              <div>
                <b>{n.title}</b>
                <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. التبويبات الأربعة (المنتجات، الهدية، السجل، الإدارة) */}
      <div className="tabs-container">
        <button onClick={()=>setActiveTab('products')} className={activeTab==='products'?'tab-button active':'tab-button'}>المنتجات</button>
        <button onClick={()=>setActiveTab('tasks')} className={activeTab==='tasks'?'tab-button active':'tab-button'}>الهدية</button>
        <button onClick={()=>setActiveTab('history')} className={activeTab==='history'?'tab-button active':'tab-button'}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={()=>setActiveTab('admin')} className={activeTab==='admin'?'tab-button active':'tab-button'}>إدارة</button>}
      </div>

      <div className="content">
        {activeTab === 'products' && (
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" onClick={() => {
                const tg = (window as any).Telegram.WebApp;
                if (user.points < p.price) return tg.showAlert('XP رصيدك غير كافٍ');
                tg.showConfirm(`تأكيد شراء ${p.title}؟`, async (ok:any) => {
                  if(ok) {
                    const res = await adminAction({action:'purchase_product', telegramId:user.id, price:p.price, productTitle:p.title, imageUrl: p.imageUrl});
                    if(res.success) { setUser((prev:any)=>({...prev, points: res.newPoints})); tg.showAlert('تم الطلب بنجاح!'); refreshData(); }
                  }
                })
              }}>
                <img src={p.imageUrl} className="product-image" />
                <div className="p-info"><h3>{p.title}</h3><span>{p.price} XP</span></div>
              </div>
            ))}
          </div>
        )}

        {/* 4. قسم الهدية (الذي كان مختفياً) */}
        {activeTab === 'tasks' && <Page1 onPointsUpdate={(p) => setUser((prev:any)=>({...prev, points:p}))} />}

        {/* 5. السجل مع النصوص الملونة (مكتمل، مرفوض، قيد الانتظار) */}
        {activeTab === 'history' && (
          <div className="history-list">
            {history.length === 0 ? <p style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>لا توجد عمليات</p> : history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div style={{display:'flex', alignItems:'center'}}>
                  <span className={`status-text status-${h.status}`}>
                    {h.status === 'completed' ? 'مكتمل' : h.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                  <div style={{marginRight:'10px'}}>
                    <p style={{fontSize:'0.9rem'}}>{h.description}</p>
                    <small style={{color:'var(--text-muted)'}}>{new Date(h.createdAt).toLocaleDateString('ar-DZ')}</small>
                  </div>
                </div>
                <div className={`history-amount ${h.amount > 0 ? 'plus' : 'minus'}`}>
                  {h.amount > 0 ? `+${h.amount}` : h.amount} XP
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. لوحة الإدارة الكاملة (الطلبات + التحكم بالأعضاء) */}
        {activeTab === 'admin' && (
          <div className="admin-section">
            <h4>📦 الطلبات المعلقة</h4>
            {adminData.orders.length === 0 ? <p>لا توجد طلبات</p> : adminData.orders.map((o:any) => (
              <div key={o.id} className="admin-card">
                <span className="admin-username-label">👤 المستخدم: @{o.user?.username || o.telegramId}</span>
                <p>{o.description}</p>
                <div className="admin-btns">
                  <button className="btn-action btn-accept" onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'completed'})}>قبول الطلب</button>
                  <button className="btn-action btn-reject" onClick={() => adminAction({action:'update_order', transactionId:o.id, status:'rejected'})}>رفض الطلب</button>
                </div>
              </div>
            ))}

            <h4>👥 التحكم بالعضو (Telegram ID)</h4>
            <div className="admin-card">
              <input id="targetId" placeholder="Telegram ID" style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'none'}} />
              <input id="amountVal" placeholder="المبلغ (مثال: 100 أو -50)" style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'none'}} />
              <div className="admin-btns">
                <button className="btn-action btn-accept" onClick={() => {
                  const id = (document.getElementById('targetId') as HTMLInputElement).value;
                  const amt = (document.getElementById('amountVal') as HTMLInputElement).value;
                  if(id && amt) adminAction({action:'manage_points', telegramId: parseInt(id), amount: amt});
                }}>تعديل الرصيد</button>
                <button className="btn-action btn-reject" onClick={() => {
                  const id = (document.getElementById('targetId') as HTMLInputElement).value;
                  if(id) { const r = prompt('سبب الحظر؟'); if(r) adminAction({action:'toggle_ban', telegramId: parseInt(id), status:'ban', reason:r}); }
                }}>حظر</button>
              </div>
            </div>

            <h4>🔔 إرسال إشعار</h4>
            <div className="admin-card">
              <input id="notifTitle" placeholder="عنوان الإشعار" style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'none'}} />
              <textarea id="notifMsg" placeholder="نص الرسالة" style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'none'}} />
              <button className="btn-action btn-blue" style={{width:'100%'}} onClick={() => {
                const id = (document.getElementById('targetId') as HTMLInputElement).value;
                const t = (document.getElementById('notifTitle') as HTMLInputElement).value;
                const m = (document.getElementById('notifMsg') as HTMLInputElement).value;
                if(id && t && m) adminAction({action:'send_notif', telegramId: parseInt(id), title: t, message: m});
              }}>إرسال الإشعار</button>
            </div>
          </div>
        )}
      </div>

      <div className="footer">Developed By <span>Borhane San</span></div>
    </div>
  )
}
