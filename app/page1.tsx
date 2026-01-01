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
      setNotification('⚠️ جاري تحضير الإعلان...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان المدمج...');

    // الحل النهائي لمنع فتح إعلانات متتالية:
    // نقوم بطلب إعلان واحد فقط ونعطل كل الخيارات التي تؤدي للتكرار التلقائي
    window.show_10400479({
      type: 'inApp',
      inAppSettings: {
        frequency: 1,       // يظهر مرة واحدة فقط في كل استدعاء
        capping: 0, 
        interval: 0, 
        timeout: 0,
        everyPage: false,   // هامة جداً: تمنع فتح إعلانات عند التنقل أو التكرار
        force: false        // جعل الاستدعاء طبيعي لمنع "الجنون" في فتح النوافذ
      }
    });

    // عداد الـ 15 ثانية (هذا الجزء مستقل تماماً عن الإعلان)
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
          
          // طلب تحديث الرصيد من السيرفر
          const balanceRes = await fetch(`/api/increase-points?telegramId=${user.id}`);
          const balanceData = await balanceRes.json();
          if (balanceData.success) {
            onPointsUpdate(balanceData.points);
          }
        }
      } catch (err) {
        setNotification('❌ خطأ في تحديث البيانات');
      } finally {
        setIsLoading(false);
        // مسح الإشعار بعد فترة قصيرة
        setTimeout(() => setNotification(''), 3000);
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
        <p className="count-label">مكتمل: {adsCount} من {MAX_ADS}</p>
      </div>

      <div className="status-msg">{notification || 'بانتظار مشاهدة الإعلان...'}</div>

      <button 
        onClick={handleWatchAd}
        disabled={adsCount >= MAX_ADS || isLoading}
        className={`main-ad-btn ${isLoading ? 'is-loading' : ''}`}
      >
        {isLoading ? 'جاري العرض والتحقق...' : adsCount >= MAX_ADS ? '✅ انتهت مهام اليوم' : `📺 شاهد الإعلان رقم ${adsCount + 1}`}
      </button>
      
      <div className="footer"><p>Developed By <span>Borhane San</span></p></div>
    </div>
  )
}
