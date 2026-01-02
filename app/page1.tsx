'use client'
import { useEffect, useState } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const MAX_ADS = 10 

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
      fetch(`/api/increase-points?telegramId=${tg.initDataUnsafe.user.id}`)
        .then(res => res.json())
        .then(data => { if (data.success) setAdsCount(data.user?.adsCount || 0) })
    }
  }, [])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    if (adsCount < 5) {
      const adsgram = (window as any).Adsgram;
      if (adsgram) {
        setNotification('📺 جاري تحميل الإعلان...');
        // استخدام المعرف الجديد 20420
        const AdController = adsgram.init({ blockId: "20420" }); 
        
        AdController.show()
          .then((result: any) => {
            if (result.done) { // التأكد من اكتمال المشاهدة
              setNotification('✅ تمت المشاهدة بنجاح!');
              processReward();
            } else {
              setIsLoading(false);
              setNotification('⚠️ لم تكتمل المشاهدة');
            }
          })
          .catch((err: any) => { 
            setIsLoading(false); 
            setNotification(`❌ خطأ: ${err.description || 'فشل العرض'}`); 
          });
      } else {
        setNotification('⏳ جاري التحميل...');
        setTimeout(() => { setIsLoading(false); handleWatchAd(); }, 2000);
      }
    } else {
      if (typeof (window as any).show_10400479 === 'function') {
        (window as any).show_10400479()
          .then(() => processReward())
          .catch(() => setIsLoading(false));
      }
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
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
      <p style={{marginBottom: '10px'}}>المهام اليومية: {adsCount} / {MAX_ADS}</p>
      <div style={{width:'100%', height:'8px', background:'#333', borderRadius:'4px', marginBottom:'20px', overflow:'hidden'}}>
        <div style={{width:`${(adsCount/MAX_ADS)*100}%`, height:'100%', background:'var(--primary)'}}></div>
      </div>
      <button onClick={handleWatchAd} disabled={adsCount >= MAX_ADS || isLoading} style={{ width: '100%', padding: '15px', background: 'var(--primary)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold' }}>
        {isLoading ? '⏳ انتظر...' : adsCount >= MAX_ADS ? '✅ اكتملت المهام' : '📺 شاهد الإعلان'}
      </button>
      {notification && <p style={{fontSize:'12px', marginTop:'10px'}}>{notification}</p>}
    </div>
  )
}
