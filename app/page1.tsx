
'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: any;
    show_10400479?: () => Promise<void>;
  }
}

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 10 

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const userData = tg.initDataUnsafe.user
      setUser(userData)
      // جلب عدد الإعلانات الحقيقي من السيرفر عند فتح الصفحة
      fetch(`/api/increase-points?telegramId=${userData.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            // تأكد من أن السيرفر يرسل adsCount
            setAdsCount(data.adsCount || 0) 
          }
        })
    }
  }, [])

  const handleWatchAd = async () => {
    // 1. فحص صارم قبل بدء العملية
    if (!user || adsCount >= MAX_ADS || isLoading) {
      setNotification('✅ لقد أتممت مهام اليوم بنجاح!');
      return;
    }

    if (typeof (window as any).show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز نظام الإعلانات...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان...');

    (window as any).show_10400479()
      .then(async () => {
        setNotification('⏳ جاري تسجيل جائزتك...');
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                telegramId: user.id, 
                action: 'watch_ad',
                currentAds: adsCount // إرسال العدد الحالي ليتأكد السيرفر
            }),
          });
          
          const data = await res.json();
          
          if (data.success) {
            setAdsCount(data.newAdsCount); // تحديث العدد من السيرفر مباشرة
            setNotification('🎉 حصلت على 1 XP بنجاح!');
            onPointsUpdate(data.newPoints);
          } else {
            // في حال رفض السيرفر (مثلاً تجاوز الحد)
            setNotification(data.message || '❌ لا يمكن إضافة المزيد اليوم');
            if(data.newAdsCount) setAdsCount(data.newAdsCount);
          }
        } catch (err) {
          setNotification('❌ فشل تحديث النقاط');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e: any) => {
        setNotification('❌ تعذر عرض الإعلان حالياً');
        setIsLoading(false);
      });
  };

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
          <span>شريط المهام اليومي</span>
          <span style={{ color: '#a29bfe' }}>{Math.min(100, Math.round((adsCount / MAX_ADS) * 100))}%</span>
        </div>

        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${Math.min(100, (adsCount / MAX_ADS) * 100)}%`, 
            height: '100%', 
            background: adsCount >= MAX_ADS ? '#00b894' : 'var(--primary)', 
            transition: 'width 0.5s ease' 
          }}></div>
        </div>
        
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '20px' }}>
            {adsCount >= MAX_ADS ? 'ممتاز! أنهيت جميع المهام' : `مكتمل ${adsCount} من ${MAX_ADS}`}
        </p>

        <div style={{ margin: '15px 0', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', color: adsCount >= MAX_ADS ? '#00b894' : 'inherit' }}>
          {adsCount >= MAX_ADS ? '✅ اكتملت مهام اليوم' : (notification || 'جاهز للعرض')}
        </div>

        <button 
          onClick={handleWatchAd} 
          disabled={adsCount >= MAX_ADS || isLoading}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
            background: adsCount >= MAX_ADS ? '#1e272e' : 'var(--primary)',
            color: adsCount >= MAX_ADS ? '#636e72' : 'white', 
            fontWeight: 'bold', 
            cursor: adsCount >= MAX_ADS ? 'default' : 'pointer',
            boxShadow: adsCount >= MAX_ADS ? 'none' : '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : '📺 شاهد الإعلان'}
        </button>
      </div>
    </div>
  )
}
