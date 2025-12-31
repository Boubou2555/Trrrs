const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    // التأكد من أن مكتبة الإعلانات محملة
    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز الإعلان...');
      return;
    }

    setIsLoading(true);

    try {
      // استدعاء نوع In-App Interstitial عند الضغط
      window.show_10400479({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,
          capping: 0.1,
          interval: 30,
          timeout: 0, // جعلناه 0 ليظهر الإعلان فوراً عند الضغط
          everyPage: false
        }
      });

      // ملاحظة: هذا النوع (inApp) أحياناً لا يدعم الـ Promise (.then) 
      // لذلك سنقوم بتحديث النقاط بمجرد تشغيل الدالة أو وضع تأخير بسيط
      
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
      console.error("Error updating points:", err);
    } finally {
      setIsLoading(false);
    }
  };
