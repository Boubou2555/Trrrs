'use client'
import { useEffect, useState } from 'react'

declare var show_10400479: any; // تعريف دالة Monetag

export default function Page1({ user, setUser }: { user: any, setUser: any }) {
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 3

  useEffect(() => {
    if (user) {
      const lastDate = user.lastAdDate ? new Date(user.lastAdDate).toDateString() : null;
      if (lastDate && lastDate !== new Date().toDateString()) {
        setAdsCount(0); // تصفير العداد بصرياً إذا كان يوماً جديداً
      } else {
        setAdsCount(user.adsCount || 0);
      }
    }
  }, [user])

  const handleWatchAd = async () => {
    if (adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    // محاولة تشغيل إعلان Monetag
    if (typeof show_10400479 === 'function') {
      show_10400479('pop').then(() => {
        updatePointsOnServer(); // نجاح المشاهدة
      }).catch(() => {
        setNotification('❌ فشل عرض الإعلان، جرب لاحقاً');
        setIsLoading(false);
      });
    } else {
      setNotification('❌ لم يتم تحميل مزود الإعلانات بعد');
      setIsLoading(false);
    }
  };

  const updatePointsOnServer = async () => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.telegramId, action: 'watch_ad' }),
      });
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newCount);
        setUser((prev: any) => ({ ...prev, points: data.points, adsCount: data.newCount }));
        setNotification('🎉 +1 XP');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  return (
    <div className="reward-container">
      {/* تصميم الكروت الخاص بك */}
      <div className="reward-card">
        <p>مشاهدات اليوم: {adsCount} / {MAX_ADS}</p>
        <button onClick={handleWatchAd} disabled={adsCount >= MAX_ADS || isLoading} className="claim-btn">
          {isLoading ? 'انتظر...' : '📺 شاهد إعلان'}
        </button>
      </div>
      {notification && <div className="notification-toast">{notification}</div>}
    </div>
  )
}
