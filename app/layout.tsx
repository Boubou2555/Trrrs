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
        {/* سكريبت التليجرام الأساسي */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
        
        {/* سكريبت AdsGram الرسمي - تم وضعه كـ beforeInteractive لضمان الجاهزية */}
        <Script 
          src="https://adsgram.ai/js/adman.js" 
          strategy="beforeInteractive" 
        />

        {/* سكريبت Monetag للمنطقة الإعلانية الخاصة بك */}
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
