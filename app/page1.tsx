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

  // الـ Block ID الخاص بك لـ AdsGram
  const ADSGRAM_BLOCK_ID = "int-20305";

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const userData = tg.initDataUnsafe.user
      setUser(userData)
      fetch(`/api/increase-points?telegramId=${userData.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) setAdsCount(data.user?.adsCount || 0) 
        })
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    if (adsCount < 5) {
      // --- تنفيذ AdsGram حسب التوثيق المرفق ---
      const adsgram = (window as any).Adsgram;
      
      if (adsgram) {
        setNotification('📺 جاري عرض إعلان AdsGram...');
        const AdController = adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        
        AdController.show()
          .then((result: any) => {
            // حسب الصورة: الرد يحتوي على done: true عند اكتمال المشاهدة
            processReward();
          })
          .catch((err: any) => {
            console.error(err);
            setIsLoading(false);
            setNotification('😔 الإعلان غير متوفر حالياً');
          });
      } else {
        setNotification('⚠️ جاري تحميل مكتبة الإعلانات...');
        setIsLoading(false);
      }
    } else {
      // --- تنفيذ Monetag ---
      if (typeof (window as any).show_10400479 === 'function') {
        setNotification('📺 جاري عرض إعلان Monetag...');
        (window as any).show_10400479()
          .then(() => processReward())
          .catch(() => {
            setIsLoading(false);
            setNotification('❌ فشل تشغيل Monetag');
          });
      }
    }
  };

  const processReward = async () => {
    setNotification('⏳ جاري تسجيل جائزتك...');
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.id, action: 'watch_ad' }),
      });
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newAdsCount);
        onPointsUpdate(data.newPoints);
        setNotification('🎉 حصلت على 1 XP!');
      }
    } catch (e) {
      setNotification('❌ خطأ في السيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (adsCount / MAX_ADS) * 100;

  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span>مهام اليوم ({adsCount < 5 ? 'AdsGram' : 'Monetag'})</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div style={{ width: '100%', height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: '0.3s' }}></div>
      </div>
      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading}
        style={{ width: '100%', padding: '15px', borderRadius: '10px', background: adsCount >= MAX_ADS ? '#555' : 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : '📺 شاهد واربح'}
      </button>
      {notification && <p style={{ marginTop: '10px', fontSize: '0.8rem' }}>{notification}</p>}
    </div>
  )
}
