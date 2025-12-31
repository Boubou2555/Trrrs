'use client'

import { useEffect, useState } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => Promise<void>;
  }
}

export default function StableAdsSystem() {
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
        // جلب الحالة عند التحميل
        fetch(`/api/increase-points?telegramId=${userData.id}`)
          .then(res => res.json())
          .then(data => { if (data.success) setAdsCount(data.count) })
      }
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    // التأكد من وجود الدالة
    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز النظام، انتظر ثانية...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري فتح الإعلان...');

    // الحل الجذري: نستخدم استدعاء 'pop' لأنه الأكثر استجابة للنقرات اليدوية
    window.show_10400479('pop')
      .then(async () => {
        // الانتظار 15 ثانية (وقت عرض الإعلان) قبل إتمام العملية
        setNotification('⏳ جاري التحقق من المشاهدة (15 ثانية)...');
        
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
            setNotification('✅ حصلت على المكافأة!');
          }
        } catch (err) {
          setNotification('❌ فشل تحديث النقاط');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error("Ad error:", e);
        setNotification('❌ تم إلغاء الإعلان أو حدث خطأ');
        setIsLoading(false);
      });
  };

  return (
    <div className="pro-container">
      <div className="mining-card">
        <div className="stats-header">
          <span>التقدم الحالي</span>
          <span className="percent">{Math.round((adsCount / MAX_ADS) * 100)}%</span>
        </div>
        
        <div className="pro-progress-container">
          <div className="pro-progress-fill" style={{ width: `${(adsCount / MAX_ADS) * 100}%` }}></div>
        </div>
        
        <p className="count-label">{adsCount} من {MAX_ADS} إعلانات</p>
      </div>

      <div className="status-msg">{notification}</div>

      <button 
        onClick={handleWatchAd}
        disabled={adsCount >= MAX_ADS || isLoading}
        className="main-ad-btn"
      >
        {isLoading ? 'جاري العرض...' : adsCount >= MAX_ADS ? '✅ اكتملت المهمة' : '📺 اضغط لمشاهدة الإعلان'}
      </button>

      <style jsx>{`
        .pro-container { padding: 20px; direction: rtl; color: white; }
        .mining-card { background: #151515; padding: 20px; border-radius: 15px; border: 1px solid #333; }
        .pro-progress-container { background: #000; height: 10px; border-radius: 5px; margin: 15px 0; overflow: hidden; }
        .pro-progress-fill { background: #0072ff; height: 100%; transition: width 0.5s ease; }
        .status-msg { text-align: center; margin: 15px 0; color: #aaa; font-size: 14px; min-height: 20px; }
        .main-ad-btn { 
          width: 100%; padding: 15px; border-radius: 12px; border: none; 
          background: #0072ff; color: white; font-weight: bold; cursor: pointer;
        }
        .main-ad-btn:disabled { background: #444; }
      `}</style>
    </div>
  )
}
