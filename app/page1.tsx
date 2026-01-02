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

  const ADSGRAM_BLOCK_ID = "int-20419"; // معرف Adsgram الخاص بك

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const userData = tg.initDataUnsafe.user
      setUser(userData)
      
      // جلب البيانات الأولية من MongoDB
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

    // الحالة الأولى: Adsgram (لأول 5 إعلانات)
    if (adsCount < 5) {
      const adsgram = (window as any).Adsgram;
      
      if (adsgram) {
        setNotification('📺 جاري تحميل إعلان Adsgram...');
        const AdController = adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        
        AdController.show()
          .then(() => {
            processReward(); // نجاح المشاهدة
          })
          .catch((err: any) => {
            setIsLoading(false);
            setNotification(err?.error === 'not_filled' ? '😔 لا يوجد إعلان حالياً' : '❌ فشل العرض');
          });
      } else {
        // محاولة إعادة الفحص إذا لم تكن المكتبة جاهزة فوراً
        setNotification('⚠️ النظام يجهز الإعلان، انتظر لحظة...');
        setTimeout(() => {
          setIsLoading(false);
          handleWatchAd(); 
        }, 2000);
      }
    } 
    // الحالة الثانية: Monetag (من الإعلان 6 إلى 10)
    else {
      if (typeof (window as any).show_10400479 === 'function') {
        setNotification('📺 جاري تحميل إعلان Monetag...');
        (window as any).show_10400479()
          .then(() => processReward())
          .catch(() => {
            setIsLoading(false);
            setNotification('❌ فشل تشغيل Monetag');
          });
      } else {
        setNotification('⚠️ نظام Monetag غير جاهز');
        setIsLoading(false);
      }
    }
  };

  const processReward = async () => {
    setNotification('⏳ جاري تسجيل جائزتك في MongoDB...');
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.id, action: 'watch_ad' }),
      });
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newAdsCount); // تحديث العداد
        onPointsUpdate(data.newPoints); // تحديث الرصيد
        setNotification('🎉 حصلت على 1 XP بنجاح!');
      }
    } catch (e) {
      setNotification('❌ خطأ في الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (adsCount / MAX_ADS) * 100;

  return (
    <div style={{ padding: '15px 0' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
          <span>المهمة اليومية ({adsCount < 5 ? 'إعلانات النوع A' : 'إعلانات النوع B'})</span>
          <span style={{ color: '#a29bfe' }}>{Math.round(progress)}%</span>
        </div>

        {/* شريط التقدم التفاعلي */}
        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '15px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            background: adsCount >= MAX_ADS ? '#00b894' : 'var(--primary)', 
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}></div>
        </div>
        
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '20px' }}>
          {adsCount >= MAX_ADS ? '✅ اكتملت جميع المهام اليوم' : `مكتمل ${adsCount} من ${MAX_ADS}`}
        </p>

        <button 
          onClick={handleWatchAd} 
          disabled={adsCount >= MAX_ADS || isLoading}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
            background: adsCount >= MAX_ADS ? '#333' : 'var(--primary)',
            color: 'white', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: adsCount >= MAX_ADS ? 'none' : '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          {isLoading ? '⏳ انتظر قليلاً...' : adsCount >= MAX_ADS ? '✅ تم اكتمال اليوم' : '📺 شاهد الإعلان واربح'}
        </button>

        {notification && (
          <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#a29bfe', animation: 'fadeIn 0.3s' }}>
            {notification}
          </p>
        )}
      </div>
    </div>
  )
}
