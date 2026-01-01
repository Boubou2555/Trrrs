'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => void;
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
  }, []);

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز الإعلان...');
      return;
    }

    // 1. تفعيل حالة التحميل والمنع
    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان...');

    // 2. استدعاء الإعلان بأبسط صورة ممكنة (In-App المباشر)
    // نمرر "inApp" فقط بدون إعدادات إضافية لمنع التداخل مع السكريبت الأساسي
    try {
        window.show_10400479({
            type: 'inApp',
            inAppSettings: {
                frequency: 1,
                everyPage: false // لضمان عدم التكرار التلقائي
            }
        });
    } catch (e) {
        console.error("Ad error");
    }

    // 3. عداد الـ 15 ثانية - القفل التام للزر لمنع الضغط المتكرر
    setTimeout(async () => {
      setNotification('⏳ جاري التحقق من مكافأتك...');
      
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
          
          // تحديث الرصيد في الصفحة الرئيسية
          const balanceRes = await fetch(`/api/increase-points?telegramId=${user.id}`);
          const balanceData = await balanceRes.json();
          if (balanceData.success) {
            onPointsUpdate(balanceData.points);
          }
        }
      } catch (err) {
        setNotification('❌ خطأ في الاتصال بالسيرفر');
      } finally {
        // فك القفل بعد انتهاء كل شيء
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
        <p className="count-label">مكتمل {adsCount} من أصل {MAX_ADS}</p>
      </div>

      <div className="status-msg">{notification || 'اضغط لمشاهدة الإعلان'}</div>

      <button 
        onClick={handleWatchAd}
        disabled={adsCount >= MAX_ADS || isLoading}
        className={`main-ad-btn ${isLoading ? 'is-loading' : ''}`}
      >
        {isLoading ? 'إعلان نشط...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : `📺 مشاهدة إعلان (${adsCount + 1})`}
      </button>
      
      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
