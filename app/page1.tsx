'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => void;
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
      const tg = window.Telegram.WebApp
      const userData = tg.initDataUnsafe?.user
      if (userData) {
        setUser(userData)
        fetch(`/api/increase-points?telegramId=${userData.id}`)
          .then(res => res.json())
          .then(data => { if (data.success) { setAdsCount(data.count); onPointsUpdate(data.points); } })
      }
    }
  }, [])

  const handleWatchAd = () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    setIsLoading(true);
    setNotification('📺 جاري طلب الإعلان...');

    if (typeof window.show_10400479 === 'function') {
        window.show_10400479({ type: 'inApp', inAppSettings: { frequency: 1, everyPage: false } });
    }

    setTimeout(async () => {
      try {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
        });
        
        const data = await res.json();
        if (data.success) {
          setAdsCount(data.newCount);
          setNotification('🎉 مبروك حصلت على 1 XP');
          
          const bRes = await fetch(`/api/increase-points?telegramId=${user.id}`);
          const bData = await bRes.json();
          if (bData.success) onPointsUpdate(bData.points);
        }
      } catch (err) {
        setNotification('❌ خطأ في السيرفر');
      } finally {
        setIsLoading(false);
      }
    }, 15000);
  };

  return (
    <div className="pro-container">
      <div className="mining-card">
        <div className="stats-header"><span>شريط المهام</span><span className="percent">{Math.round((adsCount / MAX_ADS) * 100)}%</span></div>
        <div className="pro-progress-container"><div className="pro-progress-fill" style={{ width: `${(adsCount / MAX_ADS) * 100}%` }}></div></div>
        <p className="count-label">مكتمل {adsCount} من {MAX_ADS}</p>
      </div>
      <div className="status-msg">{notification}</div>
      <button onClick={handleWatchAd} disabled={adsCount >= MAX_ADS || isLoading} className="main-ad-btn">
        {isLoading ? 'جاري العرض...' : adsCount >= MAX_ADS ? '✅ انتهى' : '📺 شاهد الإعلان'}
      </button>
    </div>
  )
}
