'use client'
import { useEffect, useState, useCallback } from 'react'
import './tasks.css' // ربط ملف التنسيق الخاص بك

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const MAX_ADS = 10 

  const calculateTime = useCallback((lastAdDate: string) => {
    const timer = setInterval(() => {
      const lastDate = new Date(lastAdDate).getTime();
      const nextDate = lastDate + (24 * 60 * 60 * 1000);
      const now = new Date().getTime();
      const diff = nextDate - now;

      if (diff > 0) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft('');
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
      fetch(`/api/increase-points?telegramId=${tg.initDataUnsafe.user.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0)
            if (data.user?.lastAdDate) calculateTime(data.user.lastAdDate);
          }
        })
    }
  }, [calculateTime])

  // وظيفة إعلانات Monetag الاحتياطية في حال لم يجد Adsgram إعلاناً
  const showMonetagAd = () => {
    const monetagShow = (window as any).show_10400479;
    if (monetagShow) {
      setNotification('🔄 جاري محاولة تحميل إعلان بديل...');
      monetagShow().then(() => {
        processReward();
      }).catch(() => {
        setIsLoading(false);
        setNotification('❌ عذراً، لا توجد إعلانات متوفرة حالياً');
      });
    } else {
      setIsLoading(false);
      setNotification('❌ فشل تحميل مزود الإعلانات الاحتياطي');
    }
  };

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    const adsgram = (window as any).Adsgram;
    if (adsgram) {
      setNotification('📺 جاري طلب الإعلان...');
      // الكود بدون debug: true كما طلبت
      const AdController = adsgram.init({ blockId: "20476" }); 
      
      AdController.show()
        .then((result: any) => {
          if (result.done) { 
            processReward();
          } else {
            setIsLoading(false);
            setNotification('⚠️ يجب إكمال المشاهدة للحصول على الجائزة');
          }
        })
        .catch((err: any) => { 
          // التحويل التلقائي لـ Monetag عند ظهور خطأ "No ads available"
          console.warn("Adsgram failed, switching to Monetag...");
          showMonetagAd(); 
        });
    } else {
      showMonetagAd();
    }
  };

  const processReward = async () => {
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
        if (data.lastAdDate) calculateTime(data.lastAdDate);
        setNotification('🎉 تم إضافة الجائزة إلى رصيدك بنجاح!'); 
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div className="task-container">
      <div className="task-header">
        <span className="task-title">المهام اليومية</span>
        <span className="task-counter">{adsCount} / {MAX_ADS}</span>
      </div>
      
      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${(adsCount / MAX_ADS) * 100}%` }}
        ></div>
      </div>

      {adsCount >= MAX_ADS && timeLeft && (
        <div className="timer-box">
          <p className="timer-text">المهمة القادمة تفتح خلال:</p>
          <p className="timer-clock">{timeLeft}</p>
        </div>
      )}

      <button 
        className={`watch-btn ${adsCount >= MAX_ADS ? 'disabled' : ''}`}
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading}
      >
        {isLoading ? '⏳ جاري المعالجة...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : '📺 شاهد واربح (+1)'}
      </button>
      
      {notification && <p className="status-message">{notification}</p>}
    </div>
  )
}
