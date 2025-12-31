const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    // التأكد من تحميل السكربت
    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز الإعلان...');
      return;
    }

    setIsLoading(true);

    try {
      // استدعاء نوع In-App Interstitial كما في لوحة التحكم
      window.show_10400479({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,   // أقصى عدد إعلانات في الجلسة
          capping: 0.1,   // مدة الجلسة (6 دقائق)
          interval: 30,  // الفاصل الزمني بين الإعلانات (ثانية)
          timeout: 0,     // جعله 0 ليفتح فوراً عند الضغط
          everyPage: false
        }
      });

      // إرسال طلب تحديث النقاط للسيرفر
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
