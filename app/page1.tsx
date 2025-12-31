'use client'

import { useEffect, useState } from 'react'
import './task.css'

export default function Page1({ user, setUser }: { user: any, setUser: any }) {
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [giftCode, setGiftCode] = useState('')
  const MAX_ADS = 3

  useEffect(() => {
    if (user) {
      setAdsCount(user.adsCount || 0)
    }
  }, [user])

  // إصلاح وظيفة تفعيل الكود لضمان قراءة الرسائل من السيرفر
  const handleUseGiftCode = async () => {
    if (!giftCode || isLoading) return
    setIsLoading(true)
    setNotification('') // مسح أي تنبيه سابق

    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegramId: user.telegramId, 
          action: 'use_gift_code', 
          code: giftCode 
        }),
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        // تحديث النقاط في الواجهة الرئيسية فوراً
        setUser((prev: any) => ({ ...prev, points: data.newPoints }))
        setNotification(`🎉 ${data.message || 'تم شحن الكود بنجاح!'}`)
        setGiftCode('') 
      } else {
        // قراءة رسالة الخطأ القادمة من السيرفر أو وضع رسالة احتياطية
        const errorMsg = data.message || data.error || 'الكود غير صحيح أو انتهى'
        setNotification(`❌ ${errorMsg}`)
      }
    } catch (err) {
      setNotification('❌ خطأ في الاتصال: تأكد من الإنترنت')
    } finally {
      setIsLoading(false)
      // إخفاء التنبيه بعد 4 ثوانٍ
      setTimeout(() => setNotification(''), 4000)
    }
  }

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            telegramId: user.telegramId, 
            action: 'watch_ad' 
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAdsCount(data.newCount)
        setUser((prev: any) => ({ ...prev, points: data.points }))
        setNotification('🎉 حصلت على 1 XP')
      } else {
        setNotification(`❌ ${data.message || 'انتهت محاولاتك'}`)
      }
    } catch (err) {
      setNotification('❌ فشل تحديث النقاط')
    } finally {
      setIsLoading(false)
      setTimeout(() => setNotification(''), 3000)
    }
  }

  return (
    <div className="reward-container">
      <h1 className="reward-title">🎁 هدايا ومكافآت</h1>

      {/* قسم كود الهدية المطور */}
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
          <button 
            onClick={handleUseGiftCode} 
            disabled={isLoading || !giftCode}
            className="gift-submit-btn"
          >
            {isLoading ? '...' : 'تفعيل'}
          </button>
        </div>
      </div>

      {/* تنبيهات النظام المستقرة */}
      {notification && (
        <div className={`notification-toast ${notification.includes('❌') ? 'error-toast' : ''}`}>
          {notification}
        </div>
      )}

      {/* قسم المهام اليومية */}
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
          style={{marginTop: '15px'}}
        >
          {adsCount >= MAX_ADS ? '✅ اكتملت المهام' : '📺 شاهد إعلان (1 XP)'}
        </button>
      </div>
    </div>
  )
}
