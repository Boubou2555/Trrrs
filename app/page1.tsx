'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => Promise<void>;
  }
}

export default function GuaranteedAdsSystem() {
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
          .then(data => { if (data.success) setAdsCount(data.count) })
      }
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    // التأكد من أن السكربت محمل في الصفحة
    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تهيئة النظام.. انتظر ثانية');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري استدعاء الإعلان المدمج...');

    // الحل لظهور الإعلان عند كل نقرة:
    // نستخدم "pop" لأنه الأكثر استجابة للنقرات المباشرة داخل تليجرام
    window.show_10400479('pop')
      .then(async () => {
        // بمجرد إغلاق الإعلان، ننتظر الـ 15 ثانية التي طلبتها للتحقق
        setNotification('⏳ جاري معالجة المكافأة (15 ثانية)...');
        
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
          }
        } catch (err) {
          setNotification('❌ فشل تحديث النقاط');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e) => {
        // إذا لم يظهر إعلان، نقوم بإعادة المحاولة بنوع "inApp" كخيار بديل
        console.log("Switching to fallback ad type...");
        window.show_10400479({ type: 'inApp', inAppSettings: { timeout: 0, interval: 0, frequency: 9 } });
        
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

      <style jsx>{`
        .pro-container { padding: 20px; direction: rtl; color: white; text-align: center; }
        .mining-card { background: #1a1a1a; padding: 25px; border-radius: 20px; border: 1px solid #333; margin-bottom: 20px; }
        .pro-progress-container { background: #000; height: 12px; border-radius: 6px; overflow: hidden; margin: 15px 0; border: 1px solid #444; }
        .pro-progress-fill { background: linear-gradient(90deg, #00c6ff, #0072ff); height: 100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .status-msg { margin: 15px 0; color: #00c6ff; font-size: 14px; min-height: 20px; font-weight: bold; }
        .main-ad-btn { 
          width: 100%; padding: 18px; border-radius: 15px; border: none; 
          background: #0072ff; color: white; font-weight: bold; font-size: 16px; cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 114, 255, 0.4);
        }
        .main-ad-btn:disabled { background: #333; box-shadow: none; color: #666; }
      `}</style>
    </div>
  )
