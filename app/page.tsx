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

  // 1. جلب البيانات الأساسية للمستخدم
  const fetchData = useCallback(async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()
      if (data.success) {
        setUser({ ...tgUser, points: data.points || 0 })
      }
      
      // قائمة المنتجات
      setProducts([
        { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
        { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png", category: "باونتي" },
        { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" },
        { id: 5, title: "عضوية شهرية ", price: 600, imageUrl: "https://i.postimg.cc/DzZcwfYC/New-Project-40-8383-F74.png", category: "شحن" }
      ])
    } catch (e) {
      console.error("Error fetching user data");
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. جلب سجل العمليات
  const fetchHistory = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/increase-points?telegramId=${user.id}`)
      const data = await res.json()
      if (data.success) setHistory(data.history || [])
    } catch (e) {
      console.error("Error fetching history");
    }
  }, [user?.id])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      tg.ready()
      tg.expand()
      fetchData(tg.initDataUnsafe.user)
    }
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab, fetchHistory])

  // 3. معالجة عملية الشراء
  const handlePurchase = (product: any) => {
    const tg = (window as any).Telegram?.WebApp
    if (!user || user.points < product.price) {
      tg.showAlert('❌ رصيدك لا يكفي لشراء هذا المنتج');
      return
    }

    tg.showConfirm(`هل تريد شراء ${product.title} مقابل ${product.price} XP؟`, async (ok: any) => {
      if (ok) {
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              telegramId: user.id, 
              action: 'purchase_product', 
              price: product.price,
              productTitle: product.title 
            }),
          })
          const data = await res.json()
          if (data.success) {
            setUser((prev: any) => ({ ...prev, points: data.newPoints }))
            tg.showAlert('✅ تم إرسال طلبك بنجاح! راجع السجل لمتابعة الحالة.');
          } else {
            tg.showAlert('❌ فشل الطلب: ' + (data.message || 'خطأ غير معروف'));
          }
        } catch (e) {
          tg.showAlert('❌ حدث خطأ في الاتصال بالسيرفر');
        }
      }
    })
  }

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      {/* بطاقة الرصيد */}
      <div className="balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">{user?.points?.toLocaleString()} <span>XP</span></div>
      </div>

      {/* التبويبات */}
      <div className="tabs-container">
        <button onClick={() => setActiveTab('products')} className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>السجل</button>
      </div>

      {/* محتوى المنتجات */}
      {activeTab === 'products' && (
        <div className="products-grid">
          {products.map((p: any) => (
            <div key={p.id} className="product-card" onClick={() => handlePurchase(p)}>
              <div className="product-image-container">
                <img src={p.imageUrl} alt="" className="product-image" />
                <div className="product-badge">{p.category}</div>
              </div>
              <div className="product-info">
                <h3 className="product-title">{p.title}</h3>
                <div className="product-price">{p.price} XP</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* محتوى المهام */}
      {activeTab === 'tasks' && (
        <Page1 onPointsUpdate={(pts: any) => setUser((u: any) => ({ ...u, points: pts }))} />
      )}

      {/* محتوى السجل */}
      {activeTab === 'history' && (
        <div className="history-list">
          {history.length === 0 ? <div className="empty-msg"><p>لا توجد عمليات مسجلة بعد</p></div> : 
            history.map((item: any) => (
              <div key={item.id} className="history-item">
                <div className="history-left">
                  <span className={`status-icon ${item.status}`}>
                    {item.status === 'pending' ? '⏳' : item.status === 'completed' ? '✅' : '❌'}
                  </span>
                  <div className="history-details">
                    <p className="history-desc">{item.description}</p>
                    <p className="history-date">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                <div className={`history-amount ${item.amount > 0 ? 'plus' : 'minus'}`}>
                  {item.amount > 0 ? `+${item.amount}` : item.amount} XP
                </div>
              </div>
            ))
          }
        </div>
      )}

      <div className="footer">
        <p>Developed By <span>Borhane San</span></p>
      </div>
    </div>
  )
}
