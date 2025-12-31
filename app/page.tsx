'use client'
import { useEffect, useState } from 'react'
import './styles.css'
import Page1 from './page1'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'tasks'>('products')

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
        body: JSON.stringify({ ...tgUser, action: 'login' }), // تحديد الأكشن كدخول
      });
      const data = await res.json();
      // تحديث الحالة ببيانات السيرفر كاملة
      setUser({ 
        ...tgUser, 
        telegramId: tgUser.id, 
        points: data.points || 0, 
        adsCount: data.adsCount || 0,
        lastAdDate: data.lastAdDate 
      });
    } finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container">جاري التحميل...</div>

  return (
    <div className="main-container">
      {/* الهيدر والبطاقة الرصيد كما هي لديك */}
      <div className="balance-card">
        <div className="balance-amount">{user?.points} <span>XP</span></div>
      </div>

      <div className="tabs-container">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>المنتجات</button>
        <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>الهدية اليومية</button>
      </div>

      {activeTab === 'products' ? (
        <div className="products-grid"> {/* عرض المنتجات */} </div>
      ) : (
        <Page1 user={user} setUser={setUser} />
      )}
    </div>
  )
}
