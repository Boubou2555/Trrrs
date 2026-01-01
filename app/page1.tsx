'use client'

import { useEffect, useState } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (pts: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)

  useEffect(() => {
    // التعديل هنا: نستخدم (window as any) لتجاوز خطأ TypeScript
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
      // جلب عدد الإعلانات الحالية من السيرفر عند الفتح
      fetch(`/api/increase-points?telegramId=${tg.initDataUnsafe.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setAdsCount(data.count || 0)
        })
    }
  }, [])

  const handleWatchAd = async () => {
    const tg = (window as any).Telegram?.WebApp
    if (!user) return

    // هنا يمكنك وضع كود شركة الإعلانات الخاص بك
    // عند انتهاء الإعلان، نقوم بتحديث النقاط في السيرفر
    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegramId: user.id, 
          action: 'watch_ad' 
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAdsCount(data.newCount)
        onPointsUpdate(data.newPoints)
        tg.showAlert('✅ حصلت على 1 XP لمشاهدة الإعلان!')
      }
    } catch (e) {
      tg.showAlert('❌ فشل تحديث النقاط')
    }
  }

  return (
    <div className="tasks-container">
      <div className="task-card">
        <div className="task-icon">🎁</div>
        <div className="task-info">
          <h3>هدية يومية (إعلانات)</h3>
          <p>شاهد إعلان واحصل على 1 XP</p>
          <small>لقد شاهدت اليوم: {adsCount}</small>
        </div>
        <button className="watch-btn" onClick={handleWatchAd}>مشاهدة</button>
      </div>
    </div>
  )
}
