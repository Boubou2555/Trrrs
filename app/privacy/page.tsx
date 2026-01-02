import React from 'react';

export default function PrivacyPolicy() {
  // تعريف الستايلات في متغيرات لسهولة القراءة
  const containerStyle: React.CSSProperties = {
    padding: '40px 20px',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: '1.8',
    direction: 'rtl',
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    color: '#333',
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    marginTop: '20px',
    marginBottom: '20px'
  };

  const headerStyle: React.CSSProperties = {
    color: '#6b33cc',
    borderBottom: '2px solid #6b33cc',
    paddingBottom: '15px',
    marginBottom: '30px',
    fontSize: '2rem',
    textAlign: 'center'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '25px',
    backgroundColor: '#f9f7ff',
    padding: '20px',
    borderRadius: '10px',
    borderRight: '5px solid #6b33cc'
  };

  const titleStyle: React.CSSProperties = {
    color: '#4a148c',
    marginTop: '0',
    fontSize: '1.4rem'
  };

  const footerStyle: React.CSSProperties = {
    marginTop: '50px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    fontSize: '0.9em',
    textAlign: 'center',
    color: '#888'
  };

  return (
    <div style={{ backgroundColor: '#f4f4f9', minHeight: '100vh', padding: '10px' }}>
      <div style={containerStyle}>
        <h1 style={headerStyle}>سياسة الخصوصية لبوت XP-WIN</h1>
        <p style={{ textAlign: 'center', fontWeight: 'bold' }}>آخر تحديث: 2 يناير 2026</p>
        
        <div style={sectionStyle}>
          <h2 style={titleStyle}>1. جمع البيانات الشخصية</h2>
          <p>نحن نجمع فقط معرف التلجرام (Telegram ID) واسم المستخدم. هذه البيانات ضرورية لإنشاء حسابك، حفظ رصيدك من نقاط XP، وتوثيق عملياتك داخل البوت.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={titleStyle}>2. كيف نستخدم معلوماتك</h2>
          <p>تُستخدم البيانات المحفوظة حصراً لإدارة نظام المكافآت، التحقق من عدد الإعلانات المشاهدة يومياً، ومعالجة طلبات الاستبدال التي ترسلها عبر المتجر.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={titleStyle}>3. إعلانات الطرف الثالث</h2>
          <p>يعرض تطبيقنا إعلانات عبر شبكات خارجية مثل (Monetag و Adsgram). قد تقوم هذه الشبكات بجمع بيانات تقنية غير معرفة للهوية (مثل نوع المتصفح أو الدولة) لتقديم محتوى إعلاني مناسب.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={titleStyle}>4. حماية وأمن البيانات</h2>
          <p>نحن نلتزم بحماية بياناتك باستخدام تقنيات تشفير لقاعدة البيانات. لن نقوم ببيع أو مشاركة بياناتك مع أي طرف ثالث لأغراض تسويقية خارج نطاق عمل البوت.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={titleStyle}>5. الموافقة على الشروط</h2>
          <p>باستخدامك لبوت XP-WIN وخدماته، فإنك تقر بموافقتك الكاملة على ما ورد في سياسة الخصوصية هذه.</p>
        </div>

        <footer style={footerStyle}>
          <p>إذا كان لديك أي استفسار حول خصوصيتك، يرجى التواصل مع الدعم الفني عبر البوت.</p>
          <p>© 2026 XP-WIN Team. جميع الحقوق محفوظة.</p>
        </footer>
      </div>
    </div>
  );
}
