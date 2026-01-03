'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (points: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const MAX_ADS = 10 
  
  // مرجع لتخزين المؤقت لضمان عدم تكراره ومنع مشاكل الأنميشن
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // وظيفة تشغيل العد التنازلي بشكل سلس
  const startCountdown = useCallback((dateStr: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const updateTimer = () => {
      const lastDate = new Date(dateStr).getTime();
      const nextDate = lastDate + (24 * 60 * 60 * 1000); // إتاحة المهمة بعد 24 ساعة
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

    updateTimer(); // تحديث فوري للقيمة قبل بدء الـ interval
    timerRef.current = setInterval(updateTimer, 1000);
  }, []);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
      // جلب بيانات المستخدم الأولية
      fetch(`/api/increase-points?telegramId=${tg.initDataUnsafe.user.id}`)
        .then(res => res.json())
        .then(data => { 
          if (data.success) {
            setAdsCount(data.user?.adsCount || 0)
            if (data.user?.lastAdDate) startCountdown(data.user.lastAdDate);
          }
        })
    }

    // تهيئة إعلان الـ Task (البانر) بالمعرف الجديد 20478
    const adsgram = (window as any).Adsgram;
    if (adsgram) {
        adsgram.init({ blockId: "20478" }).render({
            containerId: 'adsgram-task-container',
            onReward: () => {
                setNotification('✅ أحسنت! اكتملت المهمة وتم إضافة نقطة');
                processReward();
            },
            onError: (err: any) => {
                console.error('Task Ad Error:', err);
            }
        });
    }

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
          setNotification('✅ تمت المشاهدة بنجاح!');
          processReward();
        })
        .catch(() => {
          setIsLoading(false);
          setNotification('❌ خطأ في الإعلان البديل');
        });
    }
  };

  const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;
    setIsLoading(true);

    const adsgram = (window as any).Adsgram;
    if (adsgram) {
      setNotification('📺 جاري تحميل الفيديو...');
      const AdController = adsgram.init({ blockId: "20476" }); 
      
      AdController.show()
        .then((result: any) => {
          if (result.done) { 
            processReward();
          } else {
            setIsLoading(false);
            setNotification('⚠️ يجب مشاهدة الفيديو كاملاً');
          }
        })
        .catch(() => handleMonetagFallback());
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
        // تحديث العداد التنازلي فوراً إذا وصل للحد الأقصى
        if (data.lastAdDate) startCountdown(data.lastAdDate);
        setNotification('💰 تمت إضافة النقاط إلى رصيدك');
      }
    } finally { 
      setIsLoading(false); 
      // إخفاء الإشعار بعد 3 ثوانٍ ليبقى التصميم نظيفاً
      setTimeout(() => setNotification(''), 3000);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px', margin: '0 auto' }}>
      
      {/* قسم إعلان المهام الثابت (Task Banner) */}
      <div style={{ marginBottom: '20px', padding: '10px', borderRadius: '15px', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(108, 92, 231, 0.3)' }}>
        <p style={{ fontSize: '11px', color: '#a29bfe', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>مهمة سريعة إضافية</p>
        <div id="adsgram-task-container" style={{ minHeight: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* البانر سيظهر هنا آلياً */}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', color: '#ccc' }}>مهمة الفيديو اليومية</span>
        <span style={{ fontWeight: 'bold', color: '#6c5ce7' }}>{adsCount} / {MAX_ADS}</span>
      </div>
      
      {/* شريط التقدم */}
      <div style={{ width: '100%', height: '8px', background: '#111', borderRadius: '4px', marginBottom: '25px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min((adsCount / MAX_ADS) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)', transition: 'width 0.6s ease-out' }}></div>
      </div>

      {/* العداد التنازلي عند الانتهاء */}
      {adsCount >= MAX_ADS && timeLeft && (
        <div style={{ background: 'rgba(255, 159, 67, 0.1)', padding: '15px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255, 159, 67, 0.2)' }}>
          <p style={{ fontSize: '12px', color: '#ff9f43', margin: '0' }}>تتجدد المهام خلال:</p>
          <p style={{ fontSize: '24px', fontWeight: '900', color: '#fff', margin: '5px 0 0 0', fontFamily: 'monospace' }}>{timeLeft}</p>
        </div>
      )}

      {/* زر مشاهدة الفيديو */}
      <button 
        onClick={handleWatchAd} 
        disabled={adsCount >= MAX_ADS || isLoading} 
        style={{ 
          width: '100%', padding: '16px', 
          background: adsCount >= MAX_ADS ? '#2d3436' : 'linear-gradient(135deg, #6c5ce7, #8e44ad)', 
          border: 'none', borderRadius: '15px', color: 'white', fontWeight: 'bold', fontSize: '16px',
          cursor: (adsCount >= MAX_ADS || isLoading) ? 'not-allowed' : 'pointer',
          boxShadow: adsCount >= MAX_ADS ? 'none' : '0 8px 20px rgba(108, 92, 231, 0.3)',
          transition: 'transform 0.1s active, opacity 0.2s'
        }}
      >
        {isLoading ? '⏳ جاري المعالجة...' : adsCount >= MAX_ADS ? '✅ اكتملت مهام اليوم' : '📺 مشاهدة فيديو (+1 نقطة)'}
      </button>
      
      {/* التنبيهات */}
      {notification && (
        <div style={{ marginTop: '15px', padding: '10px', borderRadius: '10px', background: 'rgba(108, 92, 231, 0.1)', color: '#a29bfe', fontSize: '13px' }}>
          {notification}
        </div>
      )}
    </div>
  )
}
