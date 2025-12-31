'use client'

import { useEffect, useState, useRef } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => void;
  }
}

export default function ProfessionalInAppSystem() {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'watching' | 'completed'>('idle')
  const [notification, setNotification] = useState('')
  
  const MAX_ADS = 3
  const AD_DURATION = 15000; // مدة الإعلان 15 ثانية حسب ملاحظتك

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

  const startAdTask = async () => {
    if (adsCount >= MAX_ADS || status === 'watching') return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ نظام الإعلانات المدمج غير جاهز');
      return;
    }

    setStatus('watching');
    setNotification('📺 جاري تحميل الإعلان المدمج...');

    // 1. تشغيل الإعلان المدمج (In-App)
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

    // 2. بدء تحريك شريط التقدم ببطء ليتوافق مع الـ 15 ثانية
    animateProgressSmoothly();

    // 3. انتظار انتهاء مدة الإعلان (15 ثانية) قبل منح المكافأة
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
          setNotification(`✅ تم بنجاح! حصلت على المكافأة (${data.newCount}/3)`);
          
          if (data.newCount >= MAX_ADS) {
            setStatus('completed');
          } else {
            setStatus('idle');
          }
        }
      } catch (err) {
        setNotification('❌ خطأ في الاتصال بالسيرفر');
        setStatus('idle');
      }
    }, AD_DURATION);
  }

  // دالة تحريك الشريط بشكل انسيابي جداً خلال 15 ثانية
  const animateProgressSmoothly = () => {
    const target = ((adsCount + 1) / MAX_ADS) * 100;
    const step = (target - currentProgress) / (AD_DURATION / 100);
    
    let tempProgress = currentProgress;
    const interval = setInterval(() => {
      tempProgress += step;
      if (tempProgress >= target) {
        setCurrentProgress(target);
        clearInterval(interval);
      } else {
        setCurrentProgress(tempProgress);
      }
    }, 100);
  }

  return (
    <div className="pro-container">
      <div className="status-header">
        <span className="pulse-icon"></span>
        {status === 'watching' ? 'جارٍ عرض الإعلان المدمج...' : 'جاهز للمهمة التالية'}
      </div>
      
      <div className="mining-card">
        <div className="stats-row">
          <span>معدل الإنجاز</span>
          <span className="percent-text">{Math.round(currentProgress)}%</span>
        </div>
        
        <div className="pro-progress-container">
          <div 
            className="pro-progress-fill" 
            style={{ width: `${currentProgress}%` }}
          >
            <div className="shimmer"></div>
          </div>
        </div>
        
        <div className="counter-badge">
          {adsCount} / {MAX_ADS} إعلانات مكتملة
        </div>
      </div>

      <div className="notification-area">
        {notification || 'انقر للبدء، سيظهر الإعلان لمدة 15 ثانية'}
      </div>

      <button 
        onClick={startAdTask}
        disabled={adsCount >= MAX_ADS || status === 'watching'}
        className={`pro-btn ${status === 'watching' ? 'btn-loading' : ''}`}
      >
        {status === 'watching' ? (
          <div className="loader-container">
            <span className="spinner"></span>
            جارٍ التحقق...
          </div>
        ) : adsCount >= MAX_ADS ? (
          '✅ اكتملت جميع مهام اليوم'
        ) : (
          `🚀 تشغيل الإعلان المدمج (${adsCount + 1})`
        )}
      </button>

      <style jsx>{`
        .pro-container { padding: 25px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: white; direction: rtl; }
        .status-header { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #00d2ff; margin-bottom: 15px; }
        .pulse-icon { width: 100px; height: 100px; background: #00d2ff; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #00d2ff; animation: pulse 1.5s infinite; width: 8px; height: 8px; }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        
        .mining-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .stats-row { display: flex; justify-content: space-between; font-size: 14px; color: #ccc; }
        .percent-text { color: #00d2ff; font-weight: bold; }
        
        .pro-progress-container { background: #222; height: 14px; border-radius: 7px; overflow: hidden; margin: 15px 0; border: 1px solid #333; }
        .pro-progress-fill { background: linear-gradient(90deg, #00d2ff, #3a7bd5); height: 100%; transition: width 0.1s linear; position: relative; }
        .shimmer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shine 2s infinite; }
        @keyframes shine { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        .counter-badge { text-align: center; font-size: 12px; background: #333; padding: 4px 10px; border-radius: 10px; width: fit-content; margin: 0 auto; }
        .notification-area { text-align: center; margin: 20px 0; font-size: 14px; color: #888; height: 20px; }
        
        .pro-btn { width: 100%; padding: 18px; border-radius: 15px; border: none; background: #3a7bd5; color: white; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.3s; box-shadow: 0 5px 15px rgba(58, 123, 213, 0.4); }
        .pro-btn:disabled { background: #444; box-shadow: none; opacity: 0.7; }
        .btn-loading { background: #1e3c72; }
        
        .loader-container { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .spinner { width: 18px; height: 18px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
