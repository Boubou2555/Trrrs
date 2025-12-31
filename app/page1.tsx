'use client'

import { useEffect, useState, useRef } from 'react'
import './task.css'

declare global {
  interface Window {
    show_10400479?: (params: any) => void;
  }
}

export default function DailyReward() {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [notification, setNotification] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const MAX_ADS = 3
  const adsCountRef = useRef(0); // مرجع لمتابعة العدد الحالي بدقة داخل التوقيت

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const initDataUnsafe = tg.initDataUnsafe || {}
      if (initDataUnsafe.user) {
        setUser(initDataUnsafe.user)
        fetchStatus(initDataUnsafe.user.id)
      } else {
        setError('يرجى الدخول من تليجرام')
        setIsLoading(false)
      }
    }
  }, [])

  const fetchStatus = async (telegramId: number) => {
    try {
      const res = await fetch(`/api/increase-points?telegramId=${telegramId}`)
      const data = await res.json()
      if (data.success) {
        setAdsCount(data.count || 0)
        adsCountRef.current = data.count || 0
      }
    } catch (err) {
      console.error('Fetch error')
    } finally {
      setIsLoading(false)
    }
  }

  // دالة منح المكافأة في السيرفر
  const grantReward = async () => {
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
      });
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newCount)
        adsCountRef.current = data.newCount
        setNotification(`✅ حصلت على المكافأة رقم ${data.newCount}`);
        return true;
      }
    } catch (e) {
      console.error("Reward failed");
    }
    return false;
  }

  // الدالة الرئيسية للتشغيل التلقائي
  const startAutoAds = async () => {
    if (adsCountRef.current >= MAX_ADS || isAutoPlaying) return;
    
    setIsAutoPlaying(true);
    setIsLoading(true);

    for (let i = adsCountRef.current; i < MAX_ADS; i++) {
      setNotification(`📺 جاري عرض الإعلان (${i + 1}/${MAX_ADS})...`);

      // 1. تشغيل الإعلان
      if (typeof window.show_10400479 === 'function') {
        window.show_10400479({
          type: 'inApp',
          inAppSettings: { frequency: 3, capping: 0.1, interval: 10, timeout: 0, everyPage: false }
        });
      }

      // 2. الانتظار حتى ينتهي الإعلان (مثلاً 10 ثوانٍ) ثم منح المكافأة
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const success = await grantReward();
      
      if (!success) break; // توقف في حال حدوث خطأ بالسيرفر

      // 3. انتظار قصير قبل الإعلان التالي لتجنب تداخل الـ SDK
      if (i < MAX_ADS - 1) {
        setNotification(`⏳ انتظر قليلاً للإعلان التالي...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    setIsAutoPlaying(false);
    setIsLoading(false);
    setNotification('🎉 اكتملت جميع مهامك التلقائية!');
  };

  return (
    <div className="reward-container">
      <h1 className="reward-title">🎁 هدايا تلقائية</h1>
      
      <div className="reward-card">
        <div className="ads-counter-info">
          <span>التقدم الحالي:</span>
          <span>{adsCount} / {MAX_ADS}</span>
        </div>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(adsCount / MAX_ADS) * 100}%`, transition: 'width 1s ease' }}
          ></div>
        </div>
      </div>
      
      {notification && <div className="notification-toast">{notification}</div>}
      
      <button 
        onClick={startAutoAds} 
        disabled={adsCount >= MAX_ADS || isAutoPlaying} 
        className={`claim-btn ${isAutoPlaying ? 'running' : ''}`}
      >
        {isAutoPlaying ? (
          'جاري العمل تلقائياً...'
        ) : adsCount >= MAX_ADS ? (
          '✅ اكتملت جميع المهام'
        ) : (
          '🚀 ابدأ المشاهدة التلقائية'
        )}
      </button>

      {isAutoPlaying && (
        <p className="auto-hint">سيتم تحديث التقدم ومنح النقاط بعد كل إعلان تلقائياً.</p>
      )}
    </div>
  )
}
