'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'
import Page1 from './page1'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks' | 'history'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

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
        { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" },
        { id: 5, title: "عضوية شهرية ", price: 600, imageUrl: "https://i.postimg.cc/DzZcwfYC/New-Project-40-8383-F74.png", category: "شحن" }
      ])
    } finally { setLoading(false) }
  }, [])

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return
    const res = await fetch(`/api/increase-points?telegramId=${user.id}`)
    const data = await res.json()
    if (data.success) setHistory(data.history || [])
  }, [user?.id])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      tg.ready(); tg.expand();
      fetchData(tg.initDataUnsafe.user)
    }
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab, fetchHistory])

  const handlePurchase = (product: any) => {
    const tg = (window as any).Telegram?.WebApp
    if (user.points < product.price) return tg.showAlert('❌ رصيدك غير كافٍ')

    tg.showConfirm(`شراء ${product.title}؟`, async (ok) => {
      if (ok) {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: user.id, action: 'purchase_product', price: product.price, productTitle: product.title }),
        })
        const data = await res.json()
        if (data.success) {
          setUser((p: any) => ({ ...p, points: data.newPoints }))
          tg.showAlert('✅ تم الطلب بنجاح!')
        }
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

      <div className="tabs-container">
        <button onClick={() => setActiveTab('products')} className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>السجل</button>
      </div>

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

      {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts) => setUser((u: any) => ({ ...u, points: pts }))} />}

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
    </div>
  )
}
