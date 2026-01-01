
'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: () => Promise<void>; // تحديث النوع ليدعم Promise
  }
}

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 3

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const userData = window.Telegram.WebApp.initDataUnsafe?.user
      if (userData) {
        setUser(userData)
        fetch(`/api/increase-points?telegramId=${userData.id}`)
          .then(res => res.json())
          .then(data => { if (data.success) setAdsCount(data.count) })
      }
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز الإعلان...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان...');

    // استخدام الكود الذي أرفقته أنت (Rewarded Interstitial)
    window.show_10400479()
      .then(async () => {
        // يتم تنفيذ هذا الجزء فقط بعد انتهاء الإعلان
        setNotification('⏳ جاري تسجيل المكافأة...');
        
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
          });
          
          const data = await res.json();
          if (data.success) {
            setAdsCount(data.newCount);
            setNotification('🎉 حصلت على 1 XP بنجاح!');
            onPointsUpdate(data.newPoints || data.points);
          }
        } catch (err) {
          setNotification('❌ فشل تحديث النقاط');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e) => {
        setNotification('❌ تعذر عرض الإعلان حالياً');
        setIsLoading(false);
      });
  };

  return (
    <div className="pro-container">
      <div className="mining-card">
        <div className="stats-header">
          <span>شريط المهام</span>
          <span className="percent">{Math.round((adsCount / MAX_ADS) * 100)}%</span>
        </div>
        <div className="pro-progress-container">
          <div className="pro-progress-fill" style={{ width: `${(adsCount / MAX_ADS) * 100}%` }}></div>
        </div>
        <p className="count-label">مكتمل {adsCount} من {MAX_ADS}</p>
      </div>

      <div className="status-msg">{notification}</div>

      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading} 
        className="main-ad-btn"
      >
        {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ اكتمل اليوم' : '📺 شاهد واحصل على XP'}
      </button>
    </div>
  )
}
