'use client'

import { useEffect, useState } from 'react'
import './task.css'

export default function DailyReward({ user, setUser }: { user: any, setUser: any }) {
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [giftCode, setGiftCode] = useState('') // حالة لتخزين الكود المكتوب
  const MAX_ADS = 3

  useEffect(() => {
    if (user) {
      setAdsCount(user.adsCount || 0)
    }
  }, [user])

  // وظيفة تفعيل كود الهدية
  const handleUseGiftCode = async () => {
    if (!giftCode || isLoading) return
    setIsLoading(true)
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
      if (data.success) {
        setUser((prev: any) => ({ ...prev, points: data.newPoints })) // تحديث النقاط فوراً في الشاشة
        setNotification(`🎉 ${data.message}`)
        setGiftCode('') // مسح الخانة بعد النجاح
      } else {
        setNotification(`❌ ${data.message}`)
      }
    } catch (err) {
      setNotification('❌ خطأ في الاتصال بالسيرفر')
    } finally {
      setIsLoading(false)
      setTimeout(() => setNotification(''), 3000)
    }
  }

  // وظيفة مشاهدة الإعلانات (الموجودة سابقاً)
  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.telegramId, action: 'watch_ad' }),
      })
      const data = await res.json()
      if (data.success) {
        setAdsCount(data.newCount)
        setUser((prev: any) => ({ ...prev, points: data.points }))
        setNotification('🎉 حصلت على 1 XP')
      }
    } catch (err) {
      setNotification('❌ خطأ في التحديث')
    } finally {
      setIsLoading(true) // لإعادة التحميل البسيط
      setIsLoading(false)
      setTimeout(() => setNotification(''), 3000)
    }
  }

  return (
    <div className="reward-container">
      <h1 className="reward-title">🎁 هدايا ومكافآت</h1>

      {/* --- قسم كود الهدية الجديد --- */}
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

      {/* --- قسم الإعلانات --- */}
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

      {notification && <div className="notification-toast">{notification}</div>}
    </div>
  )
}
