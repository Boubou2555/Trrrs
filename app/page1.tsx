'use client'

import { useEffect, useState } from 'react'
import './task.css'

// تعريف الدالة لمنع أخطاء TypeScript
declare global {
  interface Window {
    show_10400479?: (type: string) => Promise<void>;
  }
}

export default function DailyReward() {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState('')
  const [error, setError] = useState<string | null>(null)
  const MAX_ADS = 3

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const initDataUnsafe = tg.initDataUnsafe || {}
      if (initDataUnsafe.user) {
        setUser(initDataUnsafe.user)
        fetchStatus(initDataUnsafe.user.id)
      } else {
        setError('يرجى الدخول من تليجرام')
        setIsLoading(false)
      }
    }
  }, [])

  const fetchStatus = async (telegramId: number) => {
    try {
      const res = await fetch(`/api/increase-points?telegramId=${telegramId}`)
      const data = await res.json()
      if (data.success) {
        setAdsCount(data.count || 0)
      }
    } catch (err) {
      console.error('Error fetching status')
    } finally {
      setIsLoading(false)
    }
  }

  // الدالة التي تعمل عند الضغط على الزر
  const handleWatchAd = () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    // التأكد من أن الدالة موجودة
    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ الإعلانات غير جاهزة بعد');
      return;
    }

    setIsLoading(true);

    // استدعاء نوع الـ Rewarded Popup كما طلبت تماماً
    window.show_10400479('pop').then(async () => {
      // الكود الذي سينفذ عند مشاهدة الإعلان بنجاح
      try {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: user.id, 
            action: 'watch_ad',
            username: user.username,
            first_name: user.first_name 
          }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          setAdsCount(data.newCount);
          setNotification('🎉 حصلت على 1 XP');
          // إخفاء التنبيه بعد 3 ثواني
          setTimeout(() => setNotification(''), 3000);
        } else {
          setNotification(data.message || '⚠️ فشل تحديث النقاط');
        }
      } catch (err) {
        setNotification('❌ خطأ في الاتصال بالسيرفر');
      } finally {
        setIsLoading(false);
      }
    }).catch(e => {
      // الكود الذي سينفذ في حال حدوث خطأ أثناء عرض الإعلان
      console.error("Ad error:", e);
      setIsLoading(false);
      setNotification('❌ تعذر تشغيل الإعلان');
      setTimeout(() => setNotification(''), 3000);
    });
  }

  return (
    <div className="reward-container">
      <h1 className="reward-title">🎁 هدايا يومية</h1>
      <div className="reward-card">
        <div className="ads-counter-info">
          <span>التقدم:</span>
          <span>{adsCount} / {MAX_ADS}</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${(adsCount / MAX_ADS) * 100}%` }}></div>
        </div>
      </div>
      
      {notification && <div className="notification-toast">{notification}</div>}
      
      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading} 
        className={`claim-btn ${adsCount >= MAX_ADS ? 'disabled' : ''}`}
      >
        {isLoading ? (
          'جاري المعالجة...'
        ) : adsCount >= MAX_ADS ? (
          '✅ اكتملت مهام اليوم'
        ) : (
          '📺 شاهد إعلان (Rewarded Popup)'
        )}
      </button>
    </div>
  )
}
