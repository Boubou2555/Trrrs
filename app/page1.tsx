'use client'

import { useEffect, useState, useRef } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => Promise<void>;
  }
}

export default function ProfessionalAdsSystem() {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [currentProgress, setCurrentProgress] = useState(0) // شريط تقدم سلس
  const [status, setStatus] = useState<'idle' | 'watching' | 'completed'>('idle')
  const [notification, setNotification] = useState('')
  
  const MAX_ADS = 3
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const user = tg.initDataUnsafe?.user
      if (user) {
        setUser(user)
        fetch(`/api/increase-points?telegramId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setAdsCount(data.count)
              setCurrentProgress((data.count / MAX_ADS) * 100)
            }
          })
      }
    }
  }, [])

  const startMining = async () => {
    if (adsCount >= MAX_ADS || status === 'watching') return;

    setStatus('watching');
    setNotification('🚀 جاري بدء جلسة الإعلانات...');

    // استدعاء الإعلان الأول
    runAdCycle();
  }

  const runAdCycle = () => {
    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ النظام غير جاهز');
      setStatus('idle');
      return;
    }

    // تشغيل الإعلان بنوع 'pop' لضمان المكافأة
    window.show_10400479('pop').then(async () => {
      setNotification('⏳ جاري معالجة البيانات ومنح المكافأة...');
      
      // حركة الشريط السلسة
      animateProgressBar();

      // إرسال البيانات للسيرفر
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
      });
      
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newCount);
        if (data.newCount < MAX_ADS) {
          setNotification(`✅ اكتمل ${data.newCount}/3 - جاهز للتالي`);
          setStatus('idle'); // نطلب منه ضغطة بسيطة للتالي لضمان عدم الحظر
        } else {
          setNotification('🎊 اكتملت جميع المهام بنجاح!');
          setStatus('completed');
        }
      }
    }).catch(() => {
      setNotification('❌ فشل الإعلان، حاول مجدداً');
      setStatus('idle');
    });
  }

  const animateProgressBar = () => {
    const target = ((adsCount + 1) / MAX_ADS) * 100;
    let start = currentProgress;
    const interval = setInterval(() => {
      if (start >= target) {
        clearInterval(interval);
      } else {
        start += 1;
        setCurrentProgress(start);
      }
    }, 20);
  }

  return (
    <div className="pro-container">
      <div className="status-badge">{status === 'watching' ? 'جارٍ العمل...' : 'النظام جاهز'}</div>
      
      <h1 className="pro-title">Reward Center</h1>
      
      <div className="mining-card">
        <div className="stats-row">
          <span>التقدم الإجمالي</span>
          <span>{Math.round(currentProgress)}%</span>
        </div>
        
        {/* شريط تقدم بتصميم احترافي */}
        <div className="pro-progress-container">
          <div 
            className="pro-progress-fill" 
            style={{ width: `${currentProgress}%` }}
          >
            <div className="shimmer"></div>
          </div>
        </div>
        
        <div className="counter-text">{adsCount} من أصل {MAX_ADS} إعلانات</div>
      </div>

      <div className="info-box">
        {notification || 'اضغط على الزر أدناه لبدء تجميع النقاط'}
      </div>

      <button 
        onClick={startMining}
        disabled={adsCount >= MAX_ADS || status === 'watching'}
        className={`pro-btn ${status === 'watching' ? 'btn-active' : ''}`}
      >
        {status === 'watching' ? 'برجاء المشاهدة...' : adsCount >= MAX_ADS ? '✅ اكتملت المهمة' : '⚡ ابدأ المهمة الآن'}
      </button>

      <style jsx>{`
        .pro-container { padding: 20px; font-family: sans-serif; color: white; direction: rtl; }
        .mining-card { background: #1a1a1a; padding: 20px; border-radius: 15px; border: 1px solid #333; margin-bottom: 20px; }
        .pro-progress-container { background: #333; height: 12px; border-radius: 6px; overflow: hidden; margin: 15px 0; position: relative; }
        .pro-progress-fill { background: linear-gradient(90deg, #00c6ff 0%, #0072ff 100%); height: 100%; transition: width 0.3s ease; position: relative; }
        .shimmer { position: absolute; top: 0; left: 0; width: 50px; height: 100%; background: rgba(255,255,255,0.2); transform: skewX(-20deg); animation: move 1.5s infinite; }
        @keyframes move { from { left: -50px; } to { left: 100%; } }
        .pro-btn { width: 100%; padding: 15px; border-radius: 10px; border: none; background: #0072ff; color: white; font-weight: bold; font-size: 16px; cursor: pointer; }
        .pro-btn:disabled { background: #444; cursor: not-allowed; }
        .status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; background: #222; border: 1px solid #444; font-size: 12px; margin-bottom: 10px; }
        .info-box { text-align: center; margin-bottom: 20px; color: #aaa; min-height: 24px; }
      `}</style>
    </div>
  )
}
