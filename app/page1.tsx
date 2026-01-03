'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const MAX_ADS = 10 
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    // 1. التأكد من وجود نافذة التليجرام
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
      fetch(`/api/increase-points?telegramId=${tg.initDataUnsafe.user.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0)
            if (data.user?.lastAdDate) startCountdown(data.user.lastAdDate);
          }
        }).catch(err => console.error("Fetch error:", err))
    }

    // 2. تهيئة إعلان الـ Task بحذر شديد لتجنب الـ Exception
    const initTaskAd = () => {
        const adsgram = (window as any).Adsgram;
        const container = document.getElementById('adsgram-task-container');
        
        if (adsgram && container) {
            try {
                adsgram.init({ blockId: "20478" }).render({
                    containerId: 'adsgram-task-container',
                    onReward: () => {
                        setNotification('✅ تمت المهمة بنجاح!');
                        processReward();
                    }
                });
            } catch (e) {
                console.error("Adsgram render error:", e);
            }
        }
    };

    // ننتظر قليلاً للتأكد من تحميل DOM وسكريبت Adsgram
    const timeoutId = setTimeout(initTaskAd, 1500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(timeoutId);
    }
  }, [startCountdown])

  const processReward = async () => {
    if (!user) return;
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
        if (data.lastAdDate) startCountdown(data.lastAdDate);
      }
    } catch (e) {
        console.error("Reward processing error:", e);
    } finally { setIsLoading(false); }
  };

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);
    const adsgram = (window as any).Adsgram;
    
    if (adsgram) {
      try {
        const AdController = adsgram.init({ blockId: "20476" }); 
        AdController.show().then((result: any) => {
          if (result.done) processReward();
          else {
            setIsLoading(false);
            setNotification('⚠️ أكمل الفيديو للحصول على الجائزة');
          }
        }).catch(() => {
            setIsLoading(false);
            setNotification('❌ تعذر تحميل الإعلان');
        });
      } catch (e) {
          setIsLoading(false);
      }
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
      
      {/* حاوية المهمة (Banner) */}
      <div style={{ marginBottom: '20px', minHeight: '80px' }}>
         <div id="adsgram-task-container"></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', color: '#999' }}>التقدم اليومي</span>
        <span style={{ color: '#6c5ce7', fontWeight: 'bold' }}>{adsCount}/{MAX_ADS}</span>
      </div>

      <div style={{ width: '100%', height: '8px', background: '#111', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ width: `${(adsCount/MAX_ADS)*100}%`, height: '100%', background: '#6c5ce7', borderRadius: '10px', transition: 'width 0.5s' }}></div>
      </div>

      {adsCount >= MAX_ADS && timeLeft && (
        <div style={{ color: '#ff9f43', marginBottom: '15px', fontWeight: 'bold' }}>
          تتجدد المهام بعد: {timeLeft}
        </div>
      )}

      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading}
        style={{ 
          width: '100%', padding: '15px', borderRadius: '12px', 
          background: adsCount >= MAX_ADS ? '#333' : '#6c5ce7', color: '#fff', border: 'none' 
        }}
      >
        {isLoading ? '⏳ جاري التحميل...' : '📺 مشاهدة إعلان فيديو'}
      </button>

      {notification && <p style={{ marginTop: '10px', color: '#a29bfe' }}>{notification}</p>}
    </div>
  )
}
