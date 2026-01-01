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
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تحضير الإعلان المدمج...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري تحميل الإعلان...');

    // الحل لضمان الظهور في كل مرة:
    // نستخدم إعدادات تجبر النظام على تجاهل الكاش (Cache) وفتح الإعلان فوراً
    try {
      window.show_10400479({
        type: 'inApp',
        inAppSettings: {
          frequency: 0,        // 0 تعني تعطيل نظام تكرار الظهور (يظهر دائماً)
          capping: 0,          // تعطيل الحد الأقصى للظهور
          interval: 0,         // لا يوجد وقت انتظار بين الإعلانات
          timeout: 0,          // تحميل فوري
          force: true,         // محاولة إجبار العرض
          everyPage: true
        }
      });
    } catch (e) {
      console.log("Ad trigger error");
    }

    // الانتظار الإلزامي للتأكد من المشاهدة
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
          setNotification('🎉 مبروك! حصلت على 1 XP');
          
          // تحديث الرصيد فوراً في الصفحة الرئيسية
          const balanceRes = await fetch(`/api/increase-points?telegramId=${user.id}`);
          const balanceData = await balanceRes.json();
          if (balanceData.success) {
            onPointsUpdate(balanceData.points);
          }
        }
      } catch (err) {
        setNotification('❌ فشل في تحديث الرصيد');
      } finally {
        setIsLoading(false);
      }
    }, 15000); 
  };

  return (
    <div className="pro-container">
      <div className="mining-card">
        <div className="stats-header">
          <span>الإنجاز اليومي</span>
          <span className="percent">{Math.round((adsCount / MAX_ADS) * 100)}%</span>
        </div>
        <div className="pro-progress-container">
          <div className="pro-progress-fill" style={{ width: `${(adsCount / MAX_ADS) * 100}%` }}></div>
        </div>
        <p className="count-label">تمت مشاهدة {adsCount} من أصل {MAX_ADS}</p>
      </div>

      <div className="status-msg">{notification || 'اضغط لمشاهدة الإعلان'}</div>

      <button 
        onClick={handleWatchAd}
        disabled={adsCount >= MAX_ADS || isLoading}
        className={`main-ad-btn ${isLoading ? 'is-loading' : ''}`}
      >
        {isLoading ? 'جاري العرض الآن...' : adsCount >= MAX_ADS ? '✅ اكتملت المهمة' : `📺 ابدأ المهمة رقم (${adsCount + 1})`}
      </button>
      
      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
