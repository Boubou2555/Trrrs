
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
      
      // جلب adsCount مباشرة من قاعدة البيانات عند فتح الصفحة
      fetch(`/api/increase-points?telegramId=${userData.id}`)
        .then(res => res.json())
        .then(data => { 
          // قراءة adsCount من بيانات المستخدم في MongoDB
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0) 
          }
        })
    }
  }, [])

  const handleWatchAd = async () => {
    // التحقق من الحد الأقصى قبل البدء
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof (window as any).show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز النظام...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان...');

    (window as any).show_10400479()
      .then(async () => {
        setNotification('⏳ جاري تحديث العداد في MongoDB...');
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              telegramId: user.id, 
              action: 'watch_ad' 
            }),
          });
          
          const data = await res.json();
          
          if (data.success) {
            // تحديث العداد في الواجهة بناءً على القيمة الجديدة من السيرفر
            setAdsCount(data.newAdsCount); 
            setNotification('🎉 حصلت على 1 XP بنجاح!');
            onPointsUpdate(data.newPoints);
          }
        } catch (err) {
          setNotification('❌ فشل تحديث البيانات');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e: any) => {
        setNotification('❌ تعذر العرض');
        setIsLoading(false);
      });
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
          <span>شريط المهام اليومي</span>
          <span style={{ color: '#a29bfe' }}>{Math.round(progress)}%</span>
        </div>

        {/* شريط التقدم الذي يتبع adsCount من الصورة */}
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
          {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ تم اكتمال اليوم' : '📺 شاهد الإعلان'}
        </button>
      </div>
    </div>
  )
}
