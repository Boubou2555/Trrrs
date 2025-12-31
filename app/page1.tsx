'use client'

import { useEffect, useState } from 'react'
import './task.css'

// تعريف الدالة لتجنب أخطاء TypeScript
declare global {
  interface Window {
    show_10400479: any;
  }
}

export default function Page1({ user, setUser }: { user: any, setUser: any }) {
  const [adsCount, setAdsCount] = useState(0)
  const [giftCode, setGiftCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 3

  useEffect(() => {
    if (user) {
      // منطق تصفير العداد بصرياً إذا تغير اليوم
      const lastDate = user.lastAdDate ? new Date(user.lastAdDate).toDateString() : null;
      const today = new Date().toDateString();
      
      if (lastDate && lastDate !== today) {
        setAdsCount(0);
      } else {
        setAdsCount(user.adsCount || 0);
      }
    }
  }, [user])

  // --- تفعيل كود الهدية ---
  const handleUseGiftCode = async () => {
    if (!giftCode.trim() || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.telegramId, action: 'use_gift_code', code: giftCode }),
      })
      const data = await res.json()
      if (data.success) {
        setUser((prev: any) => ({ ...prev, points: data.newPoints }))
        setNotification(`🎉 ${data.message}`)
        setGiftCode('')
      } else {
        setNotification(`❌ ${data.message}`)
      }
    } catch (err) {
      setNotification('❌ خطأ في الاتصال بقاعدة البيانات')
    } finally {
      setIsLoading(false)
      setTimeout(() => setNotification(''), 3000)
    }
  }

  // --- مشاهدة إعلان Monetag المكافئ ---
  const handleWatchAd = async () => {
    if (adsCount >= MAX_ADS || isLoading) return

    // التأكد من أن السكربت متاح في النافذة
    if (typeof window !== 'undefined' && typeof window.show_10400479 === 'function') {
      setIsLoading(true)
      
      window.show_10400479('pop').then(async () => {
        // إذا نجحت المشاهدة نحدث النقاط في السيرفر
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: user.telegramId, action: 'watch_ad' }),
          })
          const data = await res.json()
          if (data.success) {
            setAdsCount(data.newCount)
            setUser((prev: any) => ({ ...prev, points: data.points, adsCount: data.newCount }))
            setNotification('🎉 +1 XP تمت إضافة المكافأة')
          }
        } catch (e) {
          setNotification('❌ خطأ في تحديث البيانات')
        } finally {
          setIsLoading(false)
        }
      }).catch((e: any) => {
        setIsLoading(false)
        setNotification('❌ تم إغلاق الإعلان مبكراً أو فشل التحميل')
      })
    } else {
      setNotification('❌ جاري تجهيز الإعلانات.. انتظر لحظة')
    }
    
    setTimeout(() => setNotification(''), 3000)
  }

  return (
    <div className="reward-container">
      <h1 className="reward-title">🎁 هدايا ومكافآت</h1>

      {/* كرت كود الهدية */}
      <div className="reward-card gift-card">
        <h3 className="section-subtitle">هل لديك كود هدية؟</h3>
        <div className="gift-input-group">
          <input 
            type="text" 
            placeholder="أدخل الكود هنا..." 
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value)}
            className="gift-input"
          />
          <button onClick={handleUseGiftCode} disabled={isLoading || !giftCode} className="gift-submit-btn">
            {isLoading ? '...' : 'تفعيل'}
          </button>
        </div>
      </div>

      {notification && <div className="notification-toast">{notification}</div>}

      {/* كرت الإعلانات */}
      <div className="reward-card">
        <div className="ads-counter-info">
          <span>مهام المشاهدة اليومية</span>
          <span>{adsCount} / {MAX_ADS}</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${(adsCount / MAX_ADS) * 100}%` }}></div>
        </div>
        <button 
          onClick={handleWatchAd} 
          disabled={adsCount >= MAX_ADS || isLoading} 
          className={`claim-btn ${adsCount >= MAX_ADS ? 'disabled' : ''}`}
        >
          {adsCount >= MAX_ADS ? '✅ اكتملت المهام' : (isLoading ? 'جاري التحميل...' : '📺 شاهد إعلان (1 XP)')}
        </button>
      </div>
    </div>
  )
}
