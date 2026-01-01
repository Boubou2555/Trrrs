'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => void; // تم تغييرها لتناسب نمط In-App
  }
}

interface Page1Props {
  onPointsUpdate: (newPoints: number) => void;
}

export default function Page1({ onPointsUpdate }: Page1Props) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 3

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
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

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ النظام يستعد..');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان المدمج...');

    // التعديل الجوهري: استدعاء الإعلان داخل التطبيق (In-App)
    window.show_10400479({
      type: 'inApp',
      inAppSettings: {
        frequency: 1,      // إظهار في كل مرة
        capping: 0.1,      // تقليل القيود
        interval: 0,       // لا يوجد وقت انتظار بين الإعلانات
        timeout: 0,        // تحميل فوري
        everyPage: false
      }
    });

    // بدء عداد الـ 15 ثانية فور ظهور الإعلان
    setTimeout(async () => {
      setNotification('⏳ جاري التحقق من المشاهدة...');
      
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
          
          // تحديث الرصيد في الصفحة الرئيسية فوراً
          const balanceRes = await fetch(`/api/increase-points?telegramId=${user.id}`);
          const balanceData = await balanceRes.json();
          if (balanceData.success) {
            onPointsUpdate(balanceData.points);
          }
        }
      } catch (err) {
        setNotification('❌ حدث خطأ في النظام');
      } finally {
        setIsLoading(false);
      }
    }, 15000); // مدة الـ 15 ثانية التي حددتها
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
        <p className="count-label">{adsCount} / {MAX_ADS} إعلانات مكتملة</p>
      </div>

      <div className="status-msg">{notification || 'اضغط لمشاهدة إعلان والحصول على هدية'}</div>

      <button 
        onClick={handleWatchAd}
        disabled={adsCount >= MAX_ADS || isLoading}
        className={`main-ad-btn ${isLoading ? 'is-loading' : ''}`}
      >
        {isLoading ? 'جاري العرض والتحقق...' : adsCount >= MAX_ADS ? '✅ انتهت مهام اليوم' : `📺 شاهد الإعلان (${adsCount + 1})`}
      </button>
      
      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
