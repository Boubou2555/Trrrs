'use client'
import { useEffect, useState } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const MAX_ADS = 10 

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
      fetch(`/api/increase-points?telegramId=${tg.initDataUnsafe.user.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0)
            if (data.user?.lastAdDate) startTimer(data.user.lastAdDate);
          }
        })
    }
  }, [])

  // وظيفة حساب الوقت المتبقي
  const startTimer = (lastAdDate: string) => {
    const timerFunc = () => {
      const lastDate = new Date(lastAdDate).getTime();
      const nextAvailable = lastDate + (24 * 60 * 60 * 1000); // إضافة 24 ساعة
      const now = new Date().getTime();
      const diff = nextAvailable - now;

      if (diff > 0) {
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft('');
        if (adsCount >= MAX_ADS) setAdsCount(0); // تصفير وهمي في الواجهة حتى يتم التحديث الفعلي
      }
    };

    timerFunc();
    const interval = setInterval(timerFunc, 1000);
    return () => clearInterval(interval);
  };

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    const adsgram = (window as any).Adsgram;
    if (adsgram) {
      setNotification('📺 جاري تحميل الإعلان...');
      const AdController = adsgram.init({ blockId: "20476" }); 
      
      AdController.show()
        .then((result: any) => {
          if (result.done) { 
            setNotification('✅ تمت المشاهدة!');
            processReward();
          } else {
            setIsLoading(false);
            setNotification('⚠️ لم تكتمل المشاهدة');
          }
        })
        .catch((err: any) => { 
          setIsLoading(false); 
          setNotification(`❌ خطأ في الإعلان`); 
        });
    }
  };

  const processReward = async () => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        body: JSON.stringify({ telegramId: user.id, action: 'watch_ad' }),
      });
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newAdsCount);
        onPointsUpdate(data.newPoints);
        if (data.lastAdDate) startTimer(data.lastAdDate);
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
      <p style={{marginBottom: '10px'}}>التقدم اليومي: {adsCount} / {MAX_ADS}</p>
      
      <div style={{width:'100%', height:'8px', background:'#333', borderRadius:'4px', marginBottom:'20px', overflow:'hidden'}}>
        <div style={{width:`${(adsCount/MAX_ADS)*100}%`, height:'100%', background:'var(--primary)'}}></div>
      </div>

      {adsCount >= MAX_ADS && timeLeft && (
        <p style={{fontSize: '14px', color: '#fbc531', marginBottom: '10px'}}>
          ⏳ تفتح المهام الجديدة بعد: {timeLeft}
        </p>
      )}

      <button onClick={handleWatchAd} disabled={adsCount >= MAX_ADS || isLoading} style={{ width: '100%', padding: '15px', background: 'var(--primary)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold' }}>
        {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ اكتملت اليوم' : '📺 شاهد الإعلان'}
      </button>
      
      {notification && <p style={{fontSize:'12px', marginTop:'10px', color: '#a29bfe'}}>{notification}</p>}
    </div>
  )
}
