
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
      
      // جلب البيانات من السيرفر (قاعدة البيانات) فور تحميل الصفحة
      fetch(`/api/increase-points?telegramId=${userData.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            // هنا نحسب عدد الإعلانات التي شاهدها المستخدم اليوم من سجل العمليات
            // السيرفر يرسل history، نقوم بفلترة عمليات 'ad' التي تمت اليوم
            const today = new Date().toISOString().split('T')[0];
            const adsToday = data.history?.filter((h: any) => 
              h.type === 'ad' && h.createdAt.startsWith(today)
            ).length || 0;
            
            setAdsCount(adsToday);
          }
        })
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof (window as any).show_10400479 !== 'function') {
      setNotification('⚠️ نظام الإعلانات غير جاهز...');
      return;
    }

    setIsLoading(true);
    setNotification('📺 جاري تحميل الإعلان...');

    (window as any).show_10400479()
      .then(async () => {
        setNotification('⏳ جاري الحفظ في قاعدة البيانات...');
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: user.id, action: 'watch_ad' }),
          });
          const data = await res.json();
          if (data.success) {
            // تحديث العدد بناءً على ما حدث في قاعدة البيانات
            const newCount = adsCount + 1;
            setAdsCount(newCount);
            setNotification('🎉 حصلت على 1 XP!');
            onPointsUpdate(data.newPoints); // تحديث الرصيد في الهيدر فوراً
          }
        } catch (err) {
          setNotification('❌ خطأ في الاتصال بالسيرفر');
        } finally {
          setIsLoading(false);
        }
      })
      .catch((e: any) => {
        setNotification('❌ تم إلغاء الإعلان');
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
          <span>مهام الإعلانات اليومية</span>
          <span style={{ color: '#a29bfe' }}>{Math.round(progress)}%</span>
        </div>

        {/* شريط التقدم Progress Bar */}
        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            background: adsCount >= MAX_ADS ? '#00b894' : 'var(--primary)', 
            transition: 'width 0.5s ease' 
          }}></div>
        </div>
        
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '20px' }}>
          {adsCount >= MAX_ADS ? '✅ اكتملت جميع مهام اليوم' : `شاهدت ${adsCount} من أصل ${MAX_ADS}`}
        </p>

        <div style={{ margin: '15px 0', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)' }}>
          {adsCount >= MAX_ADS ? 'عد غداً للحصول على المزيد!' : (notification || 'الإعلان جاهز')}
        </div>

        <button 
          onClick={handleWatchAd} 
          disabled={adsCount >= MAX_ADS || isLoading}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
            background: adsCount >= MAX_ADS ? '#2d3436' : 'var(--primary)',
            color: adsCount >= MAX_ADS ? '#636e72' : 'white', 
            fontWeight: 'bold', 
            cursor: adsCount >= MAX_ADS ? 'default' : 'pointer'
          }}
        >
          {isLoading ? '⏳ جاري المعالجة...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : '📺 شاهد الإعلان واربح'}
        </button>
      </div>
    </div>
  )
}
