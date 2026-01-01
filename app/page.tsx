'use client'

import { useEffect, useState, useCallback } from 'react'
import './styles.css'
import Page1 from './page1'

const ADMIN_ID = 123456789; // ⚠️ ضع ID تليجرام الخاص بك هنا أيضاً

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks' | 'history' | 'admin'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [adminOrders, setAdminOrders] = useState<any[]>([])

  const fetchData = useCallback(async (tgUser: any) => {
    const res = await fetch('/api/increase-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgUser),
    })
    const data = await res.json()
    if (data.success) setUser({ ...tgUser, points: data.points || 0 })
    
    setProducts([
      { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
      { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" }
    ])
  }, [])

  const fetchAdminData = async () => {
    const res = await fetch(`/api/increase-points?adminId=${ADMIN_ID}`)
    const data = await res.json()
    if (data.success) setAdminOrders(data.orders)
  }

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      fetchData(tg.initDataUnsafe.user)
    }
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'admin') fetchAdminData()
  }, [activeTab])

  const completeOrder = async (id: string) => {
    await fetch('/api/increase-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete_order', transactionId: id, adminId: ADMIN_ID }),
    })
    fetchAdminData()
  }

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
        {user?.id === ADMIN_ID && <button onClick={() => setActiveTab('admin')} className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}>إدارة</button>}
      </div>

      {activeTab === 'admin' && (
        <div className="admin-list">
          <h3>الطلبات المعلقة ({adminOrders.length})</h3>
          {adminOrders.map((order: any) => (
            <div key={order.id} className="history-item">
              <div>
                <p>ID: {order.telegramId}</p>
                <p>{order.description}</p>
              </div>
              <button onClick={() => completeOrder(order.id)} style={{background:'green', color:'white', padding:'5px', borderRadius:'5px'}}>تم التسليم</button>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'products' && <div className="products-grid">{/* كود المنتجات السابق */}</div>}
      {activeTab === 'tasks' && <Page1 onPointsUpdate={(pts) => setUser((u: any) => ({ ...u, points: pts }))} />}
      {activeTab === 'history' && <div className="history-list">{/* كود السجل السابق */}</div>}
    </div>
  )
}
