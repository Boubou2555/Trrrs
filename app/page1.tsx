'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: any;
    Adsgram?: any;
    show_10400479?: () => Promise<void>; // Monetag
  }
}

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 10 

  // معرف AdsGram الجديد
  const ADSGRAM_BLOCK_ID = "int-20305";

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const userData = tg.initDataUnsafe.user
      setUser(userData)
      
      fetch(`/api/increase-points?telegramId=${userData.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0) 
          }
        })
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    setIsLoading(true);

    // نظام التوزيع: إذا كان العداد أقل من 5 نستخدم AdsGram، وإذا كان 5 أو أكثر نستخدم Monetag
    if (adsCount < 5) {
      // --- تشغيل AdsGram ---
      if (!(window as any).Adsgram) {
        setNotification('⚠️ جاري تجهيز AdsGram...');
        setIsLoading(false);
        return;
      }

      setNotification('📺 جاري تحميل إعلان AdsGram...');
      const AdController = (window as any).Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
      
      AdController.show()
        .then(() => processReward())
        .catch((err: any) => handleAdError(err));

    } else {
      // --- تشغيل Monetag ---
      if (typeof (window as any).show_10400479 !== 'function') {
        setNotification('⚠️ جاري تجهيز Monetag...');
        setIsLoading(false);
        return;
      }

      setNotification('📺 جاري تحميل إعلان Monetag...');
      (window as any).show_10400479()
        .then(() => processReward())
        .catch((err: any) => handleAdError(err));
    }
  };

  // دالة معالجة الجائزة وتحديث قاعدة البيانات
  const processReward = async () => {
    setNotification('⏳ جاري تسجيل جائزتك في قاعدة البيانات...');
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.id, action: 'watch_ad' }),
      });
      
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newAdsCount);
        setNotification('🎉 حصلت على 1 XP بنجاح!');
        onPointsUpdate(data.newPoints);
      }
    } catch (err) {
      setNotification('❌ خطأ في الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdError = (err: any) => {
    setIsLoading(false);
    setNotification(err?.error === 'not_filled' ? '😔 لا توجد إعلانات متوفرة حالياً' : '❌ فشل عرض الإعلان');
  };

  const progress = Math.min(100, (adsCount / MAX_ADS) * 100);

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
          <span>مهام اليوم ({adsCount < 5 ? 'إعلانات AdsGram' : 'إعلانات Monetag'})</span>
          <span style={{ color: '#a29bfe' }}>{Math.round(progress)}%</span>
        </div>

        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            background: adsCount >= MAX_ADS ? '#00b894' : 'var(--primary)', 
            transition: 'width 0.5s ease' 
          }}></div>
        </div>
        
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '20px' }}>
          {adsCount >= MAX_ADS ? '✅ اكتملت جميع مهام اليوم' : `مكتمل ${adsCount} من ${MAX_ADS}`}
        </p>

        <button 
          onClick={handleWatchAd} 
          disabled={adsCount >= MAX_ADS || isLoading}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
            background: adsCount >= MAX_ADS ? '#333' : 'var(--primary)',
            color: 'white', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ تم اكتمال اليوم' : '📺 شاهد الإعلان واربح'}
        </button>

        {notification && <p style={{marginTop: '15px', fontSize: '0.8rem', color: '#a29bfe'}}>{notification}</p>}
      </div>
    </div>
  )
}
