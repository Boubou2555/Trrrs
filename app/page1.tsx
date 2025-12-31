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
  const MAX_ADS = 3

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const initDataUnsafe = tg.initDataUnsafe || {}
      if (initDataUnsafe.user) {
        setUser(initDataUnsafe.user)
        fetchStatus(initDataUnsafe.user.id)
      }
      setIsLoading(false)
    }
  }, [])

  const fetchStatus = async (telegramId: number) => {
    try {
      const res = await fetch(`/api/increase-points?telegramId=${telegramId}`)
      const data = await res.json()
      if (data.success) setAdsCount(data.count || 0)
    } catch (err) { console.error('Error fetching') }
  }

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز الإعلانات...');
      return;
    }

    setIsLoading(true);
    setNotification(`📺 جاري عرض الإعلان رقم ${adsCount + 1}...`);

    // 1. تشغيل الإعلان المدمج (In-App)
    window.show_10400479({
      type: 'inApp',
      inAppSettings: {
        frequency: 3,
        capping: 0.1,
        interval: 0, // جعلناه 0 ليسمح بالتكرار السريع
        timeout: 1,
        everyPage: false
      }
    });

    // 2. منح المكافأة بعد فترة زمنية وتحديث التقدم
    // قمنا بتقليل الوقت ليكون التفاعل أسرع
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
          setNotification(`🎉 رائع! حصلت على المكافأة ${data.newCount}/3`);
          
          // 3. التحقق إذا كان يحتاج لإعلان آخر
          if (data.newCount < MAX_ADS) {
            setTimeout(() => {
              setNotification('💡 اضغط مرة أخرى لمشاهدة التالي فوراً');
              setIsLoading(false);
            }, 1000);
          } else {
            setNotification('✅ أحسنت! اكتملت جميع مهام اليوم');
            setIsLoading(false);
          }
        }
      } catch (err) {
        setIsLoading(false);
      }
    }, 6000); // 6 ثوانٍ كافية لظهور الإعلان وبدء التفاعل
  };

  return (
    <div className="reward-container">
      <h1 className="reward-title">🎁 هدايا سريعة</h1>
      
      <div className="reward-card">
        <div className="ads-counter-info">
          <span>التقدم:</span>
          <span>{adsCount} / {MAX_ADS}</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(adsCount / MAX_ADS) * 100}%`, transition: 'all 0.6s ease' }}
          ></div>
        </div>
      </div>
      
      {notification && <div className="notification-toast">{notification}</div>}
      
      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading} 
        className={`claim-btn ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? 'جاري العرض...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : `📺 شاهد الإعلان التالي`}
      </button>

      {adsCount < MAX_ADS && !isLoading && (
          <p style={{fontSize: '11px', color: '#888', marginTop: '10px'}}>
            * اضغط بعد كل مكافأة للانتقال للإعلان التالي مباشرة.
          </p>
      )}
    </div>
  )
}
