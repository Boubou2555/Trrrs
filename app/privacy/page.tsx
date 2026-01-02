"use client"; // ضروري لأننا سنستخدم أزرار وتغيير حالة

import React, { useState } from 'react';

export default function PrivacyPolicy() {
  const [lang, setLang] = useState<'AR' | 'EN'>('AR');

  // نصوص اللغتين
  const content = {
    AR: {
      title: "سياسة الخصوصية لبوت XP-WIN",
      update: "آخر تحديث: 2 يناير 2026",
      sections: [
        { t: "1. جمع البيانات", d: "نحن نجمع فقط معرف التلجرام (Telegram ID) واسم المستخدم لحفظ نقاط XP الخاصة بك." },
        { t: "2. شبكات الإعلانات", d: "يعرض تطبيقنا إعلانات عبر Monetag و Adsgram. قد يتم جمع بيانات تقنية غير شخصية." },
        { t: "3. أمن البيانات", d: "يتم تخزين بياناتك بشكل آمن ولا يتم مشاركتها مع أطراف ثالثة لأغراض تسويقية." },
        { t: "4. الموافقة", d: "باستخدامك للبوت، فإنك توافق على سياسة الخصوصية هذه." }
      ],
      footer: "© 2026 فريق XP-WIN - جميع الحقوق محفوظة"
    },
    EN: {
      title: "XP-WIN Privacy Policy",
      update: "Last Updated: Jan 2, 2026",
      sections: [
        { t: "1. Data Collection", d: "We collect your Telegram ID and username to save your XP points and progress." },
        { t: "2. Ad Networks", d: "Our app displays ads via Monetag and Adsgram. Non-personal technical data may be collected." },
        { t: "3. Security", d: "Your data is stored securely and never shared with third parties for marketing." },
        { t: "4. Consent", d: "By using this bot, you agree to this privacy policy." }
      ],
      footer: "© 2026 XP-WIN Team - All Rights Reserved"
    }
  };

  const current = content[lang];

  return (
    <div style={{
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      padding: '20px',
      color: '#f8fafc',
      direction: lang === 'AR' ? 'rtl' : 'ltr',
      // استدعاء الخطوط من Google Fonts
      fontFamily: lang === 'AR' ? "'Cairo', sans-serif" : "'Poppins', sans-serif"
    }}>
      {/* استيراد الخطوط الخارجية */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Poppins:wght@400;600&display=swap');
      `}</style>

      {/* زر تغيير اللغة */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button 
          onClick={() => setLang(lang === 'AR' ? 'EN' : 'AR')}
          style={{
            padding: '10px 25px',
            borderRadius: '50px',
            border: '2px solid #a855f7',
            backgroundColor: 'transparent',
            color: '#a855f7',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: '0.3s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#a855f722')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {lang === 'AR' ? 'Switch to English 🇺🇸' : 'التغيير للعربية 🇩🇿'}
        </button>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#1e293b',
        padding: '35px',
        borderRadius: '25px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
        border: '1px solid #334155'
      }}>
        <h1 style={{ color: '#a855f7', textAlign: 'center', fontSize: '2rem', marginBottom: '10px' }}>
          {current.title}
        </h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '40px', fontSize: '0.9rem' }}>
          {current.update}
        </p>

        {current.sections.map((sec, i) => (
          <div key={i} style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#0f172a',
            borderRadius: '15px',
            borderRight: lang === 'AR' ? '5px solid #a855f7' : 'none',
            borderLeft: lang === 'EN' ? '5px solid #a855f7' : 'none',
          }}>
            <h2 style={{ color: '#d8b4fe', fontSize: '1.2rem', marginTop: '0' }}>{sec.t}</h2>
            <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '1rem', marginBottom: '0' }}>{sec.d}</p>
          </div>
        ))}

        <footer style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '20px', color: '#64748b' }}>
          {current.footer}
        </footer>
      </div>
    </div>
  );
}
