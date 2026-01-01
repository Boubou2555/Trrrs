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
          .then(data => { 
            if (data.success) {
              setAdsCount(data.count)
              onPointsUpdate(data.points)
            }
          })
      }
    }
  }, [])

  const handleWatchAd = () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان المدمج...');

    // استدعاء الإعلان يدوياً وبسيطاً لمنع الجنون في التكرار
    if (typeof window.show_10400479 === 'function') {
      try {
        window.show_10400479({
          type: 'inApp',
          inAppSettings: { frequency: 1, everyPage: false }
        });
      } catch (e) { console.error("Ad block") }
    }

    // مؤقت أمان لفك القفل لو لم يظهر الإعلان
    const safetyReset = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setNotification('⚠️ حاول مرة أخرى');
      }
    }, 20000);

    // معالجة الجائزة بعد 15 ثانية
    setTimeout(async () => {
      try {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
        });
        
        const data = await res.json();
        if (data.success) {
          clearTimeout(safetyReset);
          setAdsCount(data.newCount);
          setNotification('🎉 حصلت على 1 XP بنجاح!');
          
          // تحديث الرصيد في الصفحة الرئيسية فوراً
          const bRes = await fetch(`/api/increase-points?telegramId=${user.id}`);
          const bData = await bRes.json();
          if (bData.success) onPointsUpdate(bData.points);
        }
      } catch (err) {
        setNotification('❌ خطأ في تحديث البيانات');
      } finally {
        setIsLoading(false);
      }
    }, 15000);
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
        <p className="count-label">مكتمل {adsCount} من {MAX_ADS} مهام</p>
      </div>

      <div className="status-msg">{notification || 'بانتظار مشاهدة الإعلان...'}</div>

      <button 
        onClick={handleWatchAd}
        disabled={adsCount >= MAX_ADS || isLoading}
        className={`main-ad-btn ${isLoading ? 'is-loading' : ''}`}
      >
        {isLoading ? '⏳ جاري المعالجة...' : adsCount >= MAX_ADS ? '✅ اكتملت مهام اليوم' : `📺 شاهد الإعلان رقم ${adsCount + 1}`}
      </button>
    </div>
  )
}
