'use client'

import { useEffect, useState } from 'react'
import './task.css'

// تعريف الدالة لتجنب أخطاء TypeScript أثناء البناء
declare global {
  interface Window {
    show_10400479?: (params: any) => Promise<void>;
  }
}

// إضافة export default لحل مشكلة Vercel
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
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      if (data.success) {
        setAdsCount(data.count || 0)
      }
    } catch (err) {
      setError('فشل الاتصال بالسيرفر')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ الإعلانات غير جاهزة');
      return;
    }

    setIsLoading(true);

    try {
      // استدعاء In-App Interstitial بناءً على وثائق Monetag المرفقة
      window.show_10400479({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,
          capping: 0.1,
          interval: 30,
          timeout: 0, // 0 لظهور فوري عند الضغط
          everyPage: false
        }
      });

      // منح النقاط للمستخدم
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
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error("Ad process failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !adsCount) return <div className="reward-container"><p>{error}</p></div>

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
        {isLoading ? '...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : '📺 شاهد إعلان (1 XP)'}
      </button>
    </div>
  )
}
