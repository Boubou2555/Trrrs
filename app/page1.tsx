'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => Promise<void>;
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
        // جلب الحالة الأولية
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
      setNotification('⚠️ جاري تهيئة النظام..');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري استدعاء الإعلان المدمج...');

    // استدعاء الإعلان (نوع pop لضمان الظهور عند النقرة)
    window.show_10400479('pop')
      .then(async () => {
        setNotification('⏳ جاري معالجة المكافأة (15 ثانية)...');
        
        // انتظار 15 ثانية حسب طلبك
        await new Promise(resolve => setTimeout(resolve, 15000));

        try {
          // تحديث النقاط
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
          });
          
          const data = await res.json();
          if (data.success) {
            setAdsCount(data.newCount);
            setNotification('🎉 حصلت على 1 XP بنجاح!');
            
            // جلب الرصيد الكلي الجديد لتحديث الواجهة الرئيسية فوراً
            const balanceRes = await fetch(`/api/increase-points?telegramId=${user.id}`);
            const balanceData = await balanceRes.json();
            if (balanceData.success) {
              onPointsUpdate(balanceData.points); // تحديث الرصيد في page.tsx
            }
          }
        } catch (err) {
          setNotification('❌ فشل تحديث النقاط');
        } finally {
          setIsLoading(false);
        }
      })
      .catch(() => {
        setNotification('❌ لم يظهر إعلان، حاول مجدداً');
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
