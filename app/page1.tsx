'use client'

import { useEffect, useState } from 'react'

export default function Page1({ onPointsUpdate }: { onPointsUpdate: (pts: number) => void }) {
  const [user, setUser] = useState<any>(null)
  const [adsCount, setAdsCount] = useState(0)

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
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
        onPointsUpdate(data.points)
        tg.showAlert('✅ حصلت على 1 XP بنجاح!')
      }
    } catch (e) {
      tg.showAlert('❌ حدث خطأ أثناء تحديث النقاط')
    }
  }

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px'
      }}>
        <div style={{ fontSize: '3rem' }}>🎁</div>
        
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>مكافأة الإعلانات</h3>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>شاهد إعلان قصير واحصل على 1 XP</p>
        </div>

        <div style={{
          background: 'rgba(108, 92, 231, 0.1)',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          color: '#a29bfe',
          border: '1px solid rgba(108, 92, 231, 0.2)'
        }}>
          إعلانات اليوم: <strong>{adsCount}</strong>
        </div>

        <button 
          onClick={handleWatchAd}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--primary)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)'
          }}
        >
          مشاهدة الإعلان الآن
        </button>
      </div>
    </div>
  )
}
