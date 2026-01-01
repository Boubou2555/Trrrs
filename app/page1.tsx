'use client'

import { useEffect, useState } from 'react'

// تعريف دالة الإعلانات لـ TypeScript حتى لا يظهر خطأ أثناء الـ Build
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
  const MAX_ADS = 10 // يمكنك تغيير العدد الأقصى هنا

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const userData = tg.initDataUnsafe.user
      setUser(userData)
      // جلب عدد الإعلانات الحالية من قاعدة بيانات Prisma
      fetch(`/api/increase-points?telegramId=${userData.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) setAdsCount(data.count || 0) 
        })
    }
  }, [])

  const handleWatchAd = async () => {
    const tg = (window as any).Telegram?.WebApp
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    // التأكد من وجود كود الإعلانات في الصفحة
    if (typeof (window as any).show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز نظام الإعلانات...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري عرض الإعلان...');

    // تشغيل الإعلان (Rewarded Interstitial)
    (window as any).show_10400479()
      .then(async () => {
        // يتم التنفيذ بعد مشاهدة الإعلان بالكامل
        setNotification('⏳ جاري تسجيل جائزتك...');
        
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              telegramId: user.id, // نستخدم التسمية الصحيحة للسيرفر
              action: 'watch_ad' 
            }),
          });
          
          const data = await res.json();
          if (data.success) {
            setAdsCount(data.newCount);
            setNotification('🎉 حصلت على 1 XP بنجاح!');
            onPointsUpdate(data.newPoints);
          }
        } catch (err) {
          setNotification('❌ فشل تحديث النقاط في السيرفر');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e) => {
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
          <span style={{ color: '#a29bfe' }}>{Math.round((adsCount / MAX_ADS) * 100)}%</span>
        </div>

        {/* شريط التقدم */}
        <div style={{ 
          width: '100%', 
          height: '10px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '5px', 
          marginBottom: '10px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${(adsCount / MAX_ADS) * 100}%`, 
            height: '100%', 
            background: 'var(--primary)', 
            transition: 'width 0.3s ease' 
          }}></div>
        </div>
        
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '20px' }}>
          مكتمل {adsCount} من {MAX_ADS} إعلانات
        </p>

        <div style={{ 
          margin: '15px 0', 
          padding: '10px', 
          borderRadius: '10px', 
          fontSize: '0.85rem',
          background: notification.includes('🎉') ? 'rgba(0,184,148,0.1)' : 'rgba(255,255,255,0.03)',
          color: notification.includes('🎉') ? '#00b894' : '#fff'
        }}>
          {notification || 'جاهز لعرض الإعلانات'}
        </div>

        <button 
          onClick={handleWatchAd} 
          disabled={adsCount >= MAX_ADS || isLoading}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            background: adsCount >= MAX_ADS ? '#333' : 'var(--primary)',
            color: '#white',
            fontWeight: 'bold',
            cursor: adsCount >= MAX_ADS ? 'not-allowed' : 'pointer',
            boxShadow: adsCount >= MAX_ADS ? 'none' : '0 4px 15px rgba(108, 92, 231, 0.3)'
          }}
        >
          {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ اكتملت مهام اليوم' : '📺 شاهد الإعلان واربح XP'}
        </button>
      </div>
    </div>
  )
}
