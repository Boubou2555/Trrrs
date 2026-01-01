'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'
import Page1 from './page1'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks'>('products')
  const [products, setProducts] = useState<any[]>([])

  const fetchUserData = useCallback(async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()
      setUser({ ...tgUser, points: data.points || 0 })
      setProducts([
        { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
        { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" },
        { id: 5, title: "عضوية شهرية ", price: 600, imageUrl: "https://i.postimg.cc/DzZcwfYC/New-Project-40-8383-F74.png", category: "شحن" }
      ])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) fetchUserData(tg.initDataUnsafe.user)
  }, [fetchUserData])

  const handlePurchase = (product: any) => {
    const tg = (window as any).Telegram?.WebApp
    if (user.points < product.price) {
        tg.showAlert('رصيدك لا يكفي!');
        return;
    }
    tg.showConfirm(`شراء ${product.title}؟`, (ok: boolean) => {
        if (ok) tg.showAlert('تم الطلب! تواصل مع الإدارة.');
    });
  }

  if (loading) return <div className="loading">جاري التحميل...</div>

  return (
    <div className="main-container">
      <div className="balance-card">
        <div className="balance-amount">{user?.points} <span>XP</span></div>
      </div>

      <div className="tabs-container">
        <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={activeTab === 'tasks' ? 'active' : ''}>الهدية</button>
      </div>

      {activeTab === 'products' ? (
        <div className="products-grid">
          {products.map(p => (
            <div key={p.id} className="product-card" onClick={() => handlePurchase(p)}>
              <img src={p.imageUrl} alt="" />
              <h3>{p.title}</h3>
              <p>{p.price} XP</p>
            </div>
          ))}
        </div>
      ) : (
        <Page1 onPointsUpdate={(pts) => setUser((u: any) => ({ ...u, points: pts }))} />
      )}
    </div>
  )
}
