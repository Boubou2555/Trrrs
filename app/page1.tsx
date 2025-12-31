const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    // التحقق من وجود الدالة التي عرفها الـ SDK
    if (typeof window.show_10400479 !== 'function') {
      alert('جاري تجهيز الإعلانات، يرجى المحاولة بعد ثوانٍ...');
      return;
    }

    setIsLoading(true);

    // تشغيل الإعلان
    window.show_10400479('pop')
      .then(async () => {
        // إذا نجحت المشاهدة، نرسل الطلب للسيرفر
        try {
          const res = await fetch('/api/increase-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: user.id, 
              action: 'watch_ad' 
            }),
          });
          
          const data = await res.json();
          if (data.success) {
            setAdsCount(data.newCount);
            setNotification('🎉 حصلت على 1 XP');
            setTimeout(() => setNotification(''), 3000);
          }
        } catch (err) {
          console.error("Database update error:", err);
        } finally {
          setIsLoading(false);
        }
      })
      .catch(e => {
        // في حال فشل الإعلان أو إغلاقه
        console.error("Ad interaction failed:", e);
        setIsLoading(false);
      });
  };
