'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => Promise<void>;
  }
}

// إضافة النوع الخاص بالـ Props لاستلام دالة التحديث من الصفحة الرئيسية
interface Page1Props {
  onPointsUpdate: (newPoints: number) => void;
}

export default function GuaranteedAdsSystem({ onPointsUpdate }: Page1Props) {
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
                // تحديث الرصيد الأولي في الصفحة الرئيسية
                onPointsUpdate(data.points)
            }
          })
      }
    }
  }, [onPointsUpdate])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تهيئة النظام.. انتظر ثانية');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري استدعاء الإعلان المدمج...');

    window.show_10400479('pop')
      .then(async () => {
        setNotification('⏳ جاري معالجة المكافأة (15 ثانية)...');
        
        // الانتظار الإلزامي لمدة 15 ثانية
        await new Promise(resolve => setTimeout(resolve, 15000));

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
            
            // التحديث السحري: نرسل الرصيد الجديد للصفحة الرئيسية فوراً
            if (data.points !== undefined) {
                onPointsUpdate(data.points);
            } else if (data.newPoints !== undefined) {
                onPointsUpdate(data.newPoints);
            }
          }
        } catch (err) {
          setNotification('❌ فشل تحديث النقاط');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.log("Ad error, trying fallback...");
        setNotification('❌ حاول الضغط مرة أخرى');
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
        <p className="count-label">{adsCount} / {MAX_ADS} إعلانات مكتملة</p>
      </div>

      <div className="status-msg">{notification}</div>

      <button 
        onClick={handleWatchAd}
        disabled={adsCount >= MAX_ADS || isLoading}
        className="main-ad-btn"
      >
        {isLoading ? 'جاري المعالجة..' : adsCount >= MAX_ADS ? '✅ انتهت مهام اليوم' : `📺 شاهد الإعلان رقم ${adsCount + 1}`}
      </button>
    </div>
  )
}
