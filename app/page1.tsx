'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: any;
    Adsgram?: any;
    show_10400479?: () => Promise<void>;
  }
}

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 10 

  // المعرف الجديد الذي أرسلته
  const ADSGRAM_BLOCK_ID = "int-20419";

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const userData = tg.initDataUnsafe.user
      setUser(userData)
      
      // جلب العداد الحالي من قاعدة البيانات
      fetch(`/api/increase-points?telegramId=${userData.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success && data.user) {
            setAdsCount(data.user.adsCount || 0) 
          }
        })
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    // أول 5 إعلانات من Adsgram
    if (adsCount < 5) {
      const adsgram = (window as any).Adsgram;
      if (adsgram) {
        setNotification('📺 جاري عرض إعلان AdsGram...');
        const AdController = adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        
        AdController.show()
          .then(() => processReward())
          .catch((err: any) => {
            setIsLoading(false);
            setNotification(err?.error === 'not_filled' ? '😔 لا يوجد إعلانات حالياً' : '❌ فشل العرض');
          });
      } else {
        setNotification('⚠️ جاري تحميل النظام...');
        setIsLoading(false);
      }
    } 
    // الـ 5 المتبقية من Monetag
    else {
      if (typeof (window as any).show_10400479 === 'function') {
        setNotification('📺 جاري عرض إعلان Monetag...');
        (window as any).show_10400479()
          .then(() => processReward())
          .catch(() => {
            setIsLoading(false);
            setNotification('❌ فشل تشغيل Monetag');
          });
      } else {
        setNotification('⚠️ Monetag غير جاهز');
        setIsLoading(false);
      }
    }
  };

  const processReward = async () => {
    setNotification('⏳ جاري تسجيل الجائزة في MongoDB...');
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.id, action: 'watch_ad' }),
      });
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newAdsCount); // تحديث عداد adsCount في الصورة
        onPointsUpdate(data.newPoints);
        setNotification('🎉 حصلت على 1 XP بنجاح!');
      }
    } catch (e) {
      setNotification('❌ خطأ في تحديث البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (adsCount / MAX_ADS) * 100;

  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
        <span>المهام اليومية ({adsCount < 5 ? 'AdsGram' : 'Monetag'})</span>
        <span style={{ color: '#a29bfe' }}>{Math.round(progress)}%</span>
      </div>
      
      {/* شريط التقدم الذي يتبع adsCount من MongoDB */}
      <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '15px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: adsCount >= MAX_ADS ? '#00b894' : 'var(--primary)', transition: 'width 0.5s ease' }}></div>
      </div>
      
      <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '20px' }}>
        {adsCount >= MAX_ADS ? '✅ اكتملت جميع مهام اليوم' : `مكتمل ${adsCount} من ${MAX_ADS}`}
      </p>

      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading}
        style={{ width: '100%', padding: '15px', borderRadius: '12px', background: adsCount >= MAX_ADS ? '#333' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ اكتملت المهمة' : '📺 شاهد الإعلان واربح'}
      </button>

      {notification && <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#a29bfe' }}>{notification}</p>}
    </div>
  )
}
