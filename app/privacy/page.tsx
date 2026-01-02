import React from 'react';

export default function PrivacyPolicy() {
  // تعريف الستايلات للوضع الداكن
  const pageBackground: React.CSSProperties = {
    backgroundColor: '#0f172a', // لون خلفية داكن جداً (Slate)
    minHeight: '100vh',
    padding: '20px',
    color: '#f8fafc',
    direction: 'rtl',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"'
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '40px auto',
    backgroundColor: '#1e293b', // لون الحاوية (Darker Slate)
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    border: '1px solid #334155'
  };

  const headerStyle: React.CSSProperties = {
    color: '#a855f7', // لون بنفسجي زاهي يتناسب مع XP
    textAlign: 'center',
    fontSize: '2.2rem',
    marginBottom: '10px',
    fontWeight: '800'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
    padding: '15px',
    borderRight: '4px solid #a855f7',
    backgroundColor: '#0f172a',
    borderRadius: '0 10px 10px 0'
  };

  const titleStyle: React.CSSProperties = {
    color: '#d8b4fe',
    fontSize: '1.25rem',
    marginTop: '0',
    marginBottom: '10px'
  };

  const textStyle: React.CSSProperties = {
    color: '#cbd5e1',
    lineHeight: '1.8',
    fontSize: '1rem'
  };

  return (
    <div style={pageBackground}>
      <div style={containerStyle}>
        <h1 style={headerStyle}>Privacy Policy | سياسة الخصوصية</h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '40px' }}>
          Last Updated: Jan 2, 2026 | آخر تحديث: 2 يناير 2026
        </p>
        
        <div style={sectionStyle}>
          <h2 style={titleStyle}>1. Data Collection | جمع البيانات</h2>
          <p style={textStyle}>
            We collect your Telegram ID and username to save your XP points and process rewards.
            <br />
            نحن نجمع معرف التلجرام واسم المستخدم الخاص بك لحفظ نقاط XP ومعالجة المكافآت.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={titleStyle}>2. Ad Networks | شبكات الإعلانات</h2>
          <p style={textStyle}>
            Our app displays ads via Monetag and Adsgram. They may collect non-personal technical data.
            <br />
            يعرض تطبيقنا إعلانات عبر Monetag و Adsgram. قد تقوم هذه الشبكات بجمع بيانات تقنية غير شخصية.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={titleStyle}>3. Data Security | أمن البيانات</h2>
          <p style={textStyle}>
            Your data is stored securely and is never shared with third parties for marketing purposes.
            <br />
            يتم تخزين بياناتك بشكل آمن ولا يتم مشاركتها أبداً مع أطراف ثالثة لأغراض تسويقية.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={titleStyle}>4. Consent | الموافقة</h2>
          <p style={textStyle}>
            By using XP-WIN, you agree to this privacy policy.
            <br />
            باستخدامك لـ XP-WIN، فإنك توافق على سياسة الخصوصية هذه.
          </p>
        </div>

        <footer style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '20px' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            © 2026 XP-WIN Team - Powered by Vercel
          </p>
        </footer>
      </div>
    </div>
  );
}
