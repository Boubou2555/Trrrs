'use client'

import { useEffect, useState, useRef } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => void;
  }
}

export default function ProfessionalStepByStepAds() {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'watching' | 'completed'>('idle')
  const [notification, setNotification] = useState('')
  
  const MAX_ADS = 3
  const AD_DURATION = 15000; // مدة الإعلان 15 ثانية

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

  const handleManualAdClick = async () => {
    if (adsCount >= MAX_ADS || status === 'watching') return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ نظام الإعلانات المدمج غير جاهز');
      return;
    }

    // بدء الحالة
    setStatus('watching');
    setNotification(`📺 جاري عرض الإعلان (${adsCount + 1}/${MAX_ADS})...`);

    // 1. استدعاء الإعلان المدمج (In-App)
    window.show_10400479({
      type: 'inApp',
      inAppSettings: {
        frequency: 3,
        capping: 0.1,
        interval: 0, 
        timeout: 0,
        everyPage: false
      }
    });

    // 2. تحريك الشريط تدريجياً خلال الـ 15 ثانية
    const targetProgress = ((adsCount + 1) / MAX_ADS) * 100;
    const startProgress = currentProgress;
    const duration = AD_DURATION;
    const startTime = Date.now();

    const updateAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = startProgress + (targetProgress - startProgress) * progress;
      
      setCurrentProgress(easedProgress);

      if (progress < 1) {
        requestAnimationFrame(updateAnimation);
      }
    };
    requestAnimationFrame(updateAnimation);

    // 3. منح المكافأة بعد انتهاء الوقت
    setTimeout(async () => {
      try {
        const res = await fetch('/api/increase-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
        });
        
        const data = await res.json();
        if (data.success) {
          setAdsCount(data.newCount);
          setNotification(`🎉 اكتمل الإعلان رقم ${data.newCount}!`);
          
          if (data.newCount >= MAX_ADS) {
            setStatus('completed');
          } else {
            // العودة للحالة العادية للسماح بضغطة جديدة
            setStatus('idle');
          }
        }
      } catch (err) {
        setNotification('❌ خطأ في منح المكافأة');
        setStatus('idle');
      }
    }, AD_DURATION);
  }

  return (
    <div className="pro-container">
      <div className="header-info">
        <span className="live-dot"></span>
        {status === 'watching' ? 'مشاهدة نشطة...' : adsCount >= MAX_ADS ? 'انتهت المهام' : 'بانتظار بدء الإعلان'}
      </div>
      
      <div className="mining-card">
        <div className="stats-header">
          <span>شريط الإنجاز</span>
          <span className="percent">{Math.round(currentProgress)}%</span>
        </div>
        
        <div className="pro-progress-container">
          <div 
            className="pro-progress-fill" 
            style={{ width: `${currentProgress}%` }}
          >
            <div className="glow-effect"></div>
          </div>
        </div>
        
        <div className="count-label">
          الحالة: {adsCount} من {MAX_ADS} إعلانات مكتملة
        </div>
      </div>

      <div className="message-box">
        {notification || 'اضغط لمشاهدة الإعلان والحصول على المكافأة'}
      </div>

      <button 
        onClick={handleManualAdClick}
        disabled={adsCount >= MAX_ADS || status === 'watching'}
        className={`main-ad-btn ${status === 'watching' ? 'is-loading' : ''}`}
      >
        {status === 'watching' ? (
          <div className="loader-wrapper">
            <div className="sync-spinner"></div>
            <span>جاري التحقق...</span>
          </div>
        ) : adsCount >= MAX_ADS ? (
          '✅ اكتملت جميع مهامك'
        ) : (
          `📺 ابدأ الإعلان رقم (${adsCount + 1})`
        )}
      </button>

      <style jsx>{`
        .pro-container { padding: 25px; color: white; direction: rtl; }
        .header-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #00d2ff; margin-bottom: 20px; }
        .live-dot { width: 8px; height: 8px; background: #00d2ff; border-radius: 50%; box-shadow: 0 0 10px #00d2ff; animation: blink 1s infinite; }
        @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        
        .mining-card { background: #111; padding: 25px; border-radius: 20px; border: 1px solid #222; position: relative; }
        .stats-header { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; color: #888; }
        .percent { color: #00d2ff; font-weight: bold; }
        
        .pro-progress-container { background: #000; height: 12px; border-radius: 6px; overflow: hidden; border: 1px solid #333; }
        .pro-progress-fill { background: linear-gradient(90deg, #00d2ff, #0072ff); height: 100%; position: relative; }
        .glow-effect { position: absolute; top: 0; left: 0; width: 40px; height: 100%; background: rgba(255,255,255,0.2); filter: blur(5px); animation: sweep 2s infinite; }
        @keyframes sweep { 0% { left: -50px; } 100% { left: 100%; } }
        
        .count-label { text-align: center; margin-top: 15px; font-size: 12px; color: #555; }
        .message-box { text-align: center; margin: 25px 0; color: #aaa; font-size: 14px; min-height: 20px; }
        
        .main-ad-btn { width: 100%; padding: 18px; border-radius: 12px; border: none; background: #0072ff; color: white; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); }
        .main-ad-btn:disabled { background: #222; color: #555; box-shadow: none; }
        .is-loading { background: #003366; }
        
        .loader-wrapper { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .sync-spinner { width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
