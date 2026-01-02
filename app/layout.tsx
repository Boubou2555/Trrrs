import type { Metadata } from "next"
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Telegram Mini App',
  description: 'Borhane App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* سكريبت التليجرام الأساسي لضمان عمل التطبيق داخل Telegram */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
        
        {/* سكريبت AdsGram الرسمي (حسب الصورة المرفقة من التوثيق) */}
        {/* ملاحظة: هذا السكريبت ضروري لتشغيل وحدة AdController في Page1 */}
        <Script 
          src="https://adsgram.ai/js/adman.js" 
          strategy="afterInteractive" 
        />

        {/* سكريبت Monetag (المنطقة الإعلانية 10400479) */}
        {/* يتم تحميله بشكل متوازٍ ليعمل عند وصول عداد الإعلانات إلى 5 */}
        <Script 
          src="//libtl.com/sdk.js" 
          data-zone="10400479" 
          data-sdk="show_10400479" 
          strategy="lazyOnload"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
