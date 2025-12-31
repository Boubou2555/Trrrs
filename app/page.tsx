'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'
import Page1 from './page1'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks'>('products')
  const [products] = useState([
    { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
    { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png", category: "باونتي" },
    { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" }
  ])

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe.user) {
        fetchUserData(tg.initDataUnsafe.user);
      }
    }
  }, []);

  const fetchUserData = async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      });
      const data = await res.json();
      setUser({ ...tgUser, telegramId: tgUser.id, points: data.points || 0, adsCount: data.adsCount || 0 });
    } finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      <div className="user-header">
        <img src={user?.photo_url || 'https://via.placeholder.com/150'} className="user-avatar" />
        <div className="user-info">
          <h1 className="user-name">مرحباً، <span>{user?.first_name}</span></h1>
          <p className="user-username">@{user?.username}</p>
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">{user?.points} <span>XP</span></div>
      </div>

      <div className="tabs-container">
        <button className={`tab-button ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>المنتجات</button>
        <button className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>الهدية اليومية</button>
      </div>

      {activeTab === 'products' ? (
        <div className="products-grid">
          {products.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-image-container">
                <img src={p.imageUrl} className="product-image" />
                <div className="product-badge">{p.category}</div>
              </div>
              <div className="product-info">
                <h3 className="product-title">{p.title}</h3>
                <div className="product-price">{p.price} XP</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Page1 user={user} setUser={setUser} />
      )}

      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
