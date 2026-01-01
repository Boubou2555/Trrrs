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

  // 1. دالة جلب بيانات المستخدم والمنتجات
  const fetchData = useCallback(async (tgUser: any) => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()
      setUser({ ...tgUser, points: data.points || 0 })
      
      // قائمة المنتجات الأصلية
      setProducts([
        { id: 1, title: "حساب جواهر 5000 اندرويد", price: 170, imageUrl: "https://i.postimg.cc/4d0Vdzhy/New-Project-40-C022-BBD.png", category: "باونتي" },
        { id: 2, title: "حساب جواهر 5000 ايفون", price: 170, imageUrl: "https://i.postimg.cc/k51fQRb3/New-Project-40-321-E54-A.png", category: "باونتي" },
        { id: 3, title: "حساب جواهر + كوزان اندرويد", price: 200, imageUrl: "https://i.postimg.cc/fL1CF4C8/New-Project-40-FE9627-F.png", category: "باونتي" },
        { id: 4, title: "تحويل فليكسي", price: 50, imageUrl: "https://i.postimg.cc/9Q1p2w1R/New-Project-40-90-F0-A70.png", category: "تحويل" },
        { id: 5, title: "عضوية شهرية ", price: 600, imageUrl: "https://i.postimg.cc/DzZcwfYC/New-Project-40-8383-F74.png", category: "شحن" }
      ])
    } catch (e) {
      console.error("Fetch error")
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. دالة جلب سجل العمليات من قاعدة البيانات
  const fetchHistory = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/increase-points?telegramId=${user.id}`)
      const data = await res.json()
      if (data.success && data.history) {
        setHistory(data.history)
      }
    } catch (e) {
      console.error("History fetch error")
    }
  }, [user?.id])

  // التحميل الأولي عند فتح التطبيق
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      fetchData(tg.initDataUnsafe.user)
    }
  }, [fetchData])

  // جلب السجل عند الانتقال لتبويب السجل
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab, fetchHistory])

  // 3. دالة الشراء مع تسجيل الطلب
  const handlePurchase = (product: any) => {
    const tg = (window as any).Telegram?.WebApp
    if (!user || !tg) return

    if (user.points < product.price) {
      tg.showAlert(`❌ رصيدك غير كافٍ! تحتاج إلى ${product.price} XP.`)
      return
    }

    tg.showConfirm(`هل أنت متأكد من شراء "${product.title}" مقابل ${product.price} XP؟`, async (confirmed) => {
      if (confirmed) {
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
            tg.showAlert('✅ تم إرسال الطلب بنجاح! راجع تبويب السجل لمتابعة الحالة.')
          } else {
            tg.showAlert('❌ فشل الطلب: ' + data.message)
          }
        } catch (e) {
          tg.showAlert('❌ حدث خطأ أثناء الاتصال بالسيرفر')
        }
      }
    })
  }

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>

  return (
    <div className="main-container">
      {/* رأس الصفحة ورصيد المستخدم */}
      <div className="balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">{user?.points?.toLocaleString()} <span>XP</span></div>
      </div>

      {/* التبويبات */}
      <div className="tabs-container">
        <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>المنتجات</button>
        <button onClick={() => setActiveTab('tasks')} className={activeTab === 'tasks' ? 'active' : ''}>الهدية</button>
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>السجل</button>
      </div>

      {/* محتوى المنتجات */}
      {activeTab === 'products' && (
        <div className="products-grid">
          {products.map(p => (
            <div key={p.id} className="product-card" onClick={() => handlePurchase(p)}>
              <div className="product-image-container">
                <img src={p.imageUrl} alt={p.title} />
                <div className="product-badge">{p.category}</div>
              </div>
              <div className="product-info">
                <h3>{p.title}</h3>
                <div className="product-price">{p.price} XP</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* محتوى المهام (الإعلانات) */}
      {activeTab === 'tasks' && (
        <Page1 onPointsUpdate={(pts) => setUser((u: any) => ({ ...u, points: pts }))} />
      )}

      {/* محتوى سجل العمليات */}
      {activeTab === 'history' && (
        <div className="history-list">
          <h2 className="history-title">آخر العمليات</h2>
          {history.length === 0 ? (
            <div className="empty-history">
              <p>لا توجد عمليات مسجلة حالياً</p>
            </div>
          ) : (
            history.map((item: any) => (
              <div key={item._id} className="history-item">
                <div className="history-left">
                  <span className={`status-icon ${item.status}`}>
                    {item.status === 'pending' ? '⏳' : item.status === 'completed' ? '✅' : '❌'}
                  </span>
                  <div className="history-details">
                    <p className="history-desc">{item.description}</p>
                    <p className="history-date">{new Date(item.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <div className={`history-amount ${item.amount > 0 ? 'plus' : 'minus'}`}>
                  {item.amount > 0 ? `+${item.amount}` : item.amount}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="footer">
        <p>Developed By <span>Borhane San</span></p>
      </div>
    </div>
  )
}
