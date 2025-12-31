const handleWatchAd = async () => {
    if (!user || adsCount >= MAX_ADS || isLoading) return;

    if (typeof window.show_10400479 !== 'function') {
      setNotification('⚠️ جاري تجهيز الإعلان...');
      return;
    }

    setIsLoading(true);

    try {
      // استدعاء يدوي للـ In-app Interstitial مع الإعدادات التي أرسلتها
      window.show_10400479({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,   // أقصى عدد إعلانات في الجلسة
          capping: 0.1,   // مدة الجلسة (6 دقائق)
          interval: 30,  // الفاصل بين الإعلانات (ثانية)
          timeout: 0,     // 0 ليظهر فوراً عند الضغط
          everyPage: false
        }
      });

      // بما أن هذا النوع لا يدعم .then بشكل موثوق، نقوم بمنح النقاط هنا
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action: 'watch_ad' }),
      });
      
      const data = await res.json();
      if (data.success) {
        setAdsCount(data.newCount);
        setNotification('🎉 حصلت على 1 XP');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error("خطأ في معالجة الإعلان");
    } finally {
      setIsLoading(false);
    }
  };
