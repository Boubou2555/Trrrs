'use client'

import { useEffect, useState, useCallback } from 'react'
import { WebApp } from '@twa-dev/types'
import './styles.css'
import Page1 from './page1'

declare global {
  interface Window {
    Telegram?: { WebApp: WebApp }
  }
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks'>('products')
  const [products, setProducts] = useState<any[]>([])

  const updateBalance = (newPoints: number) => {
    setUser((prev: any) => prev ? { ...prev, points: newPoints } : null)
  }

  const fetchUserData = useCallback(async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()
      setUser({
        id: tgUser.id,
        firstName: tgUser.first_name,
        username: tgUser.username,
        points: data.points || 0,
        photoUrl: tgUser.photo_url
      })
      
      // إعادة قائمة المنتجات الأصلية
      setProducts([
        { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
        { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png", category: "باونتي" },
        { id: 3, title: "حساب جواهر + كوزان اندرويد", price: 200, imageUrl: "https://i.postimg.cc/fL1CF4C8/New-Project-40-FE9627-F.png", category: "باونتي" },
        { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" },
        { id: 5, title: "عضوية شهرية ", price: 600, imageUrl: "https://i.postimg.cc/DzZcwfYC/New-Project-40-8383-F74.png", category: "شحن" }
      ])
    } catch (err) {
      console.error("Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      if (tg.initDataUnsafe.user) fetchUserData(tg.initDataUnsafe.user)
    }
  }, [fetchUserData])

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      <div className="user-header">
        <img src={user?.photoUrl || '/default-avatar.png'} className="user-avatar" alt="profile" />
        <div className="user-info">
          <h1 className="user-name">مرحباً، <span>{user?.firstName}</span>!</h1>
          <p className="user-username">@{user?.username || 'user'}</p>
        </div>
      </div>
      
      <div className="balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">{user?.points?.toLocaleString()} <span>XP</span></div>
      </div>

      <div className="tabs-container">
        <button className={`tab-button ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>المنتجات</button>
        <button className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>الهدية اليومية</button>
      </div>

      {activeTab === 'products' ? (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <img src={product.imageUrl} alt={product.title} className="product-image" />
                <div className="product-badge">{product.category}</div>
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <div className="product-price">{product.price} XP</div>
              </div>
            </div>
          ))}
        </div>
      ) : ( 
        <Page1 onPointsUpdate={updateBalance} /> 
      )}

      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
