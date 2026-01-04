'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [notification, setNotification] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const [lastAdDate, setLastAdDate] = useState<string | null>(null)
  const MAX_ADS = 10 
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fireConfetti = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
      const confetti = (window as any).confetti;
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
    };
    document.body.appendChild(script);
  };

  const playSuccessSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.play().catch(e => console.log("Sound failed", e));
  };

  const triggerHaptic = (type: 'success' | 'warning' | 'error' | 'light') => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
      else if (type === 'warning') tg.HapticFeedback.notificationOccurred('warning');
      else if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
      else tg.HapticFeedback.impactOccurred('light');
    }
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
      setUser(tg.initDataUnsafe.user)
      fetch(`/api/increase-points?telegramId=${tg.initDataUnsafe.user.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0)
            if (data.user?.lastAdDate) {
                setLastAdDate(data.user.lastAdDate);
                startCountdown(data.user.lastAdDate);
            }
          }
        })
        .finally(() => setIsInitialLoading(false));
    } else {
      setIsInitialLoading(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, [startCountdown])

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading || isInitialLoading) return;
    triggerHaptic('light');
    setIsLoading(true);

    const adsgram = (window as any).Adsgram;
    if (adsgram) {
      setNotification('📺 جاري تحضير الإعلان...');
      const AdController = adsgram.init({ blockId: "20475", debug: false }); 
      AdController.show()
        .then((result: any) => {
          if (result.done) { 
            processReward();
          } else {
            setIsLoading(false);
            triggerHaptic('warning');
            setNotification('⚠️ يجب مشاهدة الإعلان كاملاً');
          }
        })
        .catch(() => { 
          triggerHaptic('error');
          setIsLoading(false);
          setNotification('❌ تعذر تحميل الإعلان');
        });
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
        const newCount = data.newAdsCount;
        setAdsCount(newCount);
        onPointsUpdate(data.newPoints);
        playSuccessSound();
        triggerHaptic('success');
        if (newCount >= MAX_ADS) fireConfetti();
        if (data.lastAdDate) {
            setLastAdDate(data.lastAdDate);
            startCountdown(data.lastAdDate);
        }
        setNotification('💰 تمت إضافة النقطة بنجاح!');
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* ستايل مدمج للأنيميشن */}
      <style>{`
        @keyframes shake {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          50% { transform: rotate(0eg); }
          75% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .gift-box {
          font-size: 50px;
          cursor: pointer;
          display: inline-block;
          animation: shake 0.5s infinite;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '14px', color: '#ccc' }}>مهمة المشاهدة اليومية</span>
        <span style={{ fontWeight: 'bold', color: '#6c5ce7' }}>
          {isInitialLoading ? '...' : `${adsCount} / ${MAX_ADS}`}
        </span>
      </div>
      
      <div style={{ width: '100%', height: '12px', background: '#1a1a1a', borderRadius: '6px', marginBottom: '25px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
        <div style={{ 
          width: isInitialLoading ? '0%' : `${Math.min((adsCount / MAX_ADS) * 100, 100)}%`, 
          height: '100%', 
          background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)', 
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}></div>
      </div>

      {adsCount >= MAX_ADS && !isInitialLoading ? (
        <div style={{ padding: '20px' }}>
          <div className="gift-box" onClick={() => { fireConfetti(); triggerHaptic('success'); }}>🎁</div>
          <p style={{ color: '#fff', fontWeight: 'bold', marginTop: '10px' }}>لقد حصلت على جميع مكافآت اليوم!</p>
          {timeLeft && (
            <div style={{ background: 'rgba(255, 159, 67, 0.1)', padding: '10px', borderRadius: '12px', marginTop: '10px' }}>
               <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9f43', margin: 0 }}>{timeLeft}</p>
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={handleWatchAd} 
          disabled={isInitialLoading || isLoading} 
          style={{ 
            width: '100%', padding: '18px', 
            background: 'linear-gradient(135deg, #6c5ce7, #8e44ad)', 
            border: 'none', borderRadius: '15px', color: 'white', fontWeight: 'bold', fontSize: '16px',
            cursor: (isInitialLoading || isLoading) ? 'not-allowed' : 'pointer',
            boxShadow: '0 10px 20px rgba(108, 92, 231, 0.3)',
            transition: 'all 0.2s ease',
            transform: isLoading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {isInitialLoading ? '⏳ جاري التحقق...' : (isLoading ? '⏳ انتظر قليلاً...' : '📺 مشاهدة إعلان (+1 نقطة)')}
        </button>
      )}
      
      {notification && <p style={{ fontSize: '13px', marginTop: '15px', color: '#a29bfe', fontWeight: '500' }}>{notification}</p>}
    </div>
  )
}
