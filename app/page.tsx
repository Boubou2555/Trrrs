'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'
import Page1 from './page1'

const ADMIN_ID = 5149849049;

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks' | 'history' | 'admin'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [adminOrders, setAdminOrders] = useState<any[]>([])

  const fetchData = useCallback(async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()
      if (data.success) setUser({ ...tgUser, points: data.points || 0 })
      
      setProducts([
        { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
        { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png", category: "باونتي" },
        { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" },
        { id: 5, title: "عضوية شهرية ", price: 600, imageUrl: "https://i.postimg.cc/DzZcwfYC/New-Project-40-8383-F74.png", category: "شحن" }
      ])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      tg.ready(); tg.expand();
      fetchData(tg.initDataUnsafe.user)
    }
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'history' && user?.id) {
      fetch(`/api/increase-points?telegramId=${user.id}`).then(r => r.json()).then(d => setHistory(d.history || []))
    }
    if (activeTab === 'admin') {
      fetch(`/api/increase-points?adminId=${ADMIN_ID}`).then(r => r.json()).then(d => setAdminOrders(d.orders || []))
    }
  }, [activeTab, user?.id])

  const handlePurchase = (product: any) => {
    const tg = (window as any).Telegram?.WebApp
    if (user.points < product.price) return tg.showAlert('❌ رصيدك غير كافٍ')
    tg.showConfirm(`شراء ${product.title}؟`, async (ok: any) => {
      if (ok) {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: user.id, action: 'purchase_product', price: product.price, productTitle: product.title }),
        })
        const data = await res.json()
        if (data.success) { setUser((p: any) => ({ ...p, points: data.newPoints })); tg.showAlert('✅ تم الطلب!') }
      }
    })
  }

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      <div className="balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">{user?.points?.toLocaleString()} <span>XP</span></div>
      </div>

      <div className="tabs-container" style={{ gridTemplateColumns: user?.id === ADMIN_ID ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', display: 'grid' }}>
        <button onClick={() => setActiveTab('products')} className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>السجل</button>
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}>إدارة</button>}
      </div>

      <div className="content-area">
        {activeTab === 'products' && (
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card" onClick={() => handlePurchase(p)}>
                <div className="product-image-container"><img src={p.imageUrl} alt="" className="product-image" /><div className="product-badge">{p.category}</div></div>
                <div className="product-info"><h3 className="product-title">{p.title}</h3><div className="product-price">{p.price} XP</div></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts: any) => setUser((u: any) => ({ ...u, points: pts }))} />}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.length === 0 ? <p className="empty-msg">السجل فارغ</p> : 
              history.map((item: any) => (
                <div key={item.id} className="history-item">
                  <div className="history-left">
                    <span className={`status-icon ${item.status}`}>{item.status === 'pending' ? '⏳' : '✅'}</span>
                    <div className="history-details"><p className="history-desc">{item.description}</p><p className="history-date">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</p></div>
                  </div>
                  <div className={`history-amount ${item.amount > 0 ? 'plus' : 'minus'}`}>{item.amount > 0 ? `+${item.amount}` : item.amount}</div>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-list">
            <h3 style={{textAlign:'center', marginBottom:'15px'}}>الطلبات المعلقة ({adminOrders.length})</h3>
            {adminOrders.length === 0 ? <p className="empty-msg">لا توجد طلبات</p> : 
              adminOrders.map((order: any) => (
                <div key={order.id} className="history-item" style={{flexDirection:'column', alignItems:'flex-start', gap:'10px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <span style={{fontSize:'12px', color:'#a29bfe'}}>ID: {order.telegramId}</span>
                    <button onClick={() => {
                        fetch('/api/increase-points', { method:'POST', body: JSON.stringify({action:'complete_order', transactionId: order.id, adminId: ADMIN_ID})})
                        .then(() => setActiveTab('products'))
                    }} style={{background:'#00b894', border:'none', color:'white', padding:'4px 10px', borderRadius:'5px'}}>تأكيد التسليم</button>
                  </div>
                  <p style={{margin:0}}>{order.description}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
