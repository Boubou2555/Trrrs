'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => void;
  }
}

export default function DailyReward() {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState('')
  const [error, setError] = useState<string | null>(null)
  const MAX_ADS = 3 // الحد الأقصى للمكافآت اليومية

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
        // نأخذ عدد الإعلانات المشاهدة اليوم من قاعدة البيانات لتحديث شريط التقدم
        setAdsCount(data.count || 0)
      }
    } catch (err) {
      console.error('Fetch error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز الإعلان...');
      return;
    }

    setIsLoading(true);

    // 1. تشغيل الإعلان المدمج
    window.show_10400479({
      type: 'inApp',
      inAppSettings: {
        frequency: 3,
        capping: 0.1,
        interval: 10, // قمنا بتقليل الفاصل إلى 10 ثوانٍ ليكون أسرع للمستخدم
        timeout: 0,
        everyPage: false
      }
    });

    // 2. منح المكافأة بعد 7 ثوانٍ (الوقت التقريبي لظهور الإعلان البيني)
    setTimeout(async () => {
      try {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: user.id, 
            action: 'watch_ad' 
          }),
        });
        
        const data = await res.json();
        if (data.success) {
          // تحديث شريط التقدم فوراً بمقدار إعلان واحد
          setAdsCount(data.newCount); 
          setNotification('🎉 أحسنت! حصلت على 1 XP');
          setTimeout(() => setNotification(''), 3000);
        }
      } catch (err) {
        console.error("Reward error");
      } finally {
        setIsLoading(false);
      }
    }, 7000); 
  };

  return (
    <div className="reward-container">
      <h1 className="reward-title">🎁 هدايا يومية</h1>
      
      <div className="reward-card">
        <div className="ads-counter-info">
          <span>التقدم اليومي:</span>
          {/* عرض العدد الحالي من 3 */}
          <span>{adsCount} / {MAX_ADS}</span>
        </div>
        
        {/* شريط التقدم يتفاعل مع كل إعلان */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(adsCount / MAX_ADS) * 100}%`, transition: 'width 0.5s ease-in-out' }}
          ></div>
        </div>
        
        <p className="reward-hint">شاهد إعلاناً لزيادة تقدمك والحصول على نقاط</p>
      </div>
      
      {notification && <div className="notification-toast">{notification}</div>}
      
      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading} 
        className={`claim-btn ${adsCount >= MAX_ADS ? 'disabled' : ''}`}
      >
        {isLoading ? (
          <span className="loader">جاري المعالجة...</span>
        ) : adsCount >= MAX_ADS ? (
          '✅ اكتملت جميع مهام اليوم'
        ) : (
          `📺 شاهد إعلان رقم (${adsCount + 1})`
        )}
      </button>

      {adsCount < MAX_ADS && !isLoading && (
        <p style={{fontSize: '11px', color: '#888', marginTop: '12px', textAlign: 'center'}}>
          بإمكانك مشاهدة الإعلان التالي بعد 10 ثوانٍ
        </p>
      )}
    </div>
  )
}
