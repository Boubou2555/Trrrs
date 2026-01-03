'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const [lastAdDate, setLastAdDate] = useState<string | null>(null)
  const MAX_ADS = 10 
  
  // نستخدم useRef لتخزين المعرف الخاص بالـ interval لمسحه عند الحاجة
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // وظيفة تحديث الوقت (منفصلة عن الـ Effect لتسهيل التحكم)
  const startCountdown = useCallback((dateStr: string) => {
    // مسح أي مؤقت قديم قبل بدء واحد جديد
    if (timerRef.current) clearInterval(timerRef.current);

    const updateTimer = () => {
      const lastDate = new Date(dateStr).getTime();
      const nextDate = lastDate + (24 * 60 * 60 * 1000); // 24 ساعة
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

    updateTimer(); // التحديث الفوري الأول
    timerRef.current = setInterval(updateTimer, 1000);
  }, []);

  // جلب البيانات عند تحميل الصفحة
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
    }

    // تنظيف المؤقت عند إغلاق الصفحة
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [startCountdown])

  const handleMonetagFallback = () => {
    const showMonetagAd = (window as any).show_10400479;
    if (showMonetagAd) {
      setNotification('📺 جاري تحضير إعلان بديل...');
      showMonetagAd()
        .then(() => {
          setNotification('✅ أحسنت! جاري تحديث بياناتك...');
          processReward();
        })
        .catch(() => {
          setIsLoading(false);
          setNotification('❌ خطأ في تحميل الإعلان البديل أيضاً');
        });
    } else {
      setIsLoading(false);
      setNotification('❌ لم يتم العثور على مشغل الإعلانات');
    }
  };

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    const adsgram = (window as any).Adsgram;
    if (adsgram) {
      setNotification('📺 جاري تحضير الإعلان...');
      const AdController = adsgram.init({ blockId: "20471", debug: false }); 
      
      AdController.show()
        .then((result: any) => {
          if (result.done) { 
            setNotification('✅ أحسنت! جاري تحديث بياناتك...');
            processReward();
          } else {
            setIsLoading(false);
            setNotification('⚠️ يجب مشاهدة الإعلان كاملاً');
          }
        })
        .catch(() => { 
          console.log("Adsgram failed, switching to Monetag...");
          handleMonetagFallback();
        });
    } else {
        handleMonetagFallback();
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
        if (data.lastAdDate) {
            setLastAdDate(data.lastAdDate);
            startCountdown(data.lastAdDate); // تشغيل العداد فوراً بعد اكتمال الإعلانات
        }
        setNotification('💰 تمت إضافة النقطة بنجاح!');
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '14px', color: '#ccc' }}>مهمة المشاهدة اليومية</span>
        <span style={{ fontWeight: 'bold', color: '#6c5ce7' }}>{adsCount} / {MAX_ADS}</span>
      </div>
      
      <div style={{ width: '100%', height: '12px', background: '#1a1a1a', borderRadius: '6px', marginBottom: '25px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
        <div style={{ width: `${Math.min((adsCount / MAX_ADS) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
      </div>

      {adsCount >= MAX_ADS && timeLeft && (
        <div style={{ background: 'rgba(255, 159, 67, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255, 159, 67, 0.2)' }}>
          <p style={{ fontSize: '12px', color: '#ff9f43', margin: '0 0 5px 0' }}>انتظر حتى اليوم التالي للمشاهدة مرة أخرى</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0 }}>{timeLeft}</p>
        </div>
      )}

      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading} 
        style={{ 
          width: '100%', padding: '18px', 
          background: adsCount >= MAX_ADS ? '#2d3436' : 'linear-gradient(135deg, #6c5ce7, #8e44ad)', 
          border: 'none', borderRadius: '15px', color: 'white', fontWeight: 'bold', fontSize: '16px',
          cursor: (adsCount >= MAX_ADS || isLoading) ? 'not-allowed' : 'pointer',
          boxShadow: adsCount >= MAX_ADS ? 'none' : '0 10px 20px rgba(108, 92, 231, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        {isLoading ? '⏳ انتظر قليلاً...' : adsCount >= MAX_ADS ? '✅ اكتملت مهام اليوم' : '📺 مشاهدة إعلان (+1 نقطة)'}
      </button>
      
      {notification && <p style={{ fontSize: '13px', marginTop: '15px', color: '#a29bfe', fontWeight: '500' }}>{notification}</p>}
    </div>
  )
}
