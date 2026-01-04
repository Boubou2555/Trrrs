'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

// تعريف الـ Props ليتوافق مع TypeScript
interface Page1Props {
  onPointsUpdate: (points: number) => void;
}

export default function Page1({ onPointsUpdate }: Page1Props) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState('')
  const MAX_ADS = 10 
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fireConfetti = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
      const confetti = (window as any).confetti;
      if (confetti) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
      }
    };
    document.body.appendChild(script);
  };

  const startCountdown = useCallback((dateStr: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const updateTimer = () => {
      const lastDate = new Date(dateStr).getTime();
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
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  }, []);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      setUser(u)
      fetch(`/api/increase-points?telegramId=${u.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0)
            if (data.user?.lastAdDate) startCountdown(data.user.lastAdDate);
          }
        })
        .finally(() => setIsInitialLoading(false));
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, [startCountdown])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    const adsgram = (window as any).Adsgram;
    if (adsgram) {
      const AdController = adsgram.init({ blockId: "20475" }); 
      AdController.show()
        .then(async (result: any) => {
          if (result.done) { 
            const res = await fetch('/api/increase-points', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegramId: user.id, action: 'watch_ad' }),
            });
            const data = await res.json();
            if (data.success) {
              setAdsCount(data.newAdsCount);
              onPointsUpdate(data.newPoints); // إرسال النقاط الجديدة للملف الرئيسي
              if (data.newAdsCount >= MAX_ADS) fireConfetti();
            }
          }
        })
        .catch(() => {
            const tg = (window as any).Telegram?.WebApp;
            tg?.showAlert("فشل تحميل الإعلان، حاول لاحقاً.");
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
        const tg = (window as any).Telegram?.WebApp;
        tg?.showAlert("خدمة الإعلانات غير متوفرة حالياً.");
    }
  };

  if (isInitialLoading) return <div style={{textAlign:'center', padding:'20px'}}>جاري التحميل...</div>

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: 'var(--card)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{fontSize:'0.9rem'}}>المهمة اليومية (مشاهدة)</span>
        <span style={{ fontWeight: 'bold', color: 'var(--primary-light)' }}>{adsCount}/{MAX_ADS}</span>
      </div>
      
      <div style={{ width: '100%', height: '8px', background: '#000', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ width: `${(adsCount / MAX_ADS) * 100}%`, height: '100%', background: 'var(--primary)', transition: '0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
      </div>

      {adsCount >= MAX_ADS ? (
        <div style={{padding:'10px'}}>
          <div style={{fontSize: '40px', marginBottom:'10px'}}>✅</div>
          <p style={{fontSize:'0.85rem'}}>لقد أكملت جميع مهام اليوم!</p>
          <p style={{fontSize:'0.8rem', color:'var(--primary-light)', marginTop:'5px'}}>تفتح المهمة التالية بعد: {timeLeft}</p>
        </div>
      ) : (
        <button 
          onClick={handleWatchAd} 
          disabled={isLoading}
          className="tab-button active"
          style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize:'0.9rem', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
        >
          {isLoading ? 'جاري التحميل...' : 'مشاهدة إعلان (+1 XP)'}
        </button>
      )}
    </div>
  )
}
