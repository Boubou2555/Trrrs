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
        {/* 1. سكريبت التليجرام الأساسي */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        
        {/* 2. سكريبت AdsGram الرسمي (لأول 5 إعلانات) */}
        <Script 
          src="https://adsgram.ai/js/adman.js" 
          strategy="lazyOnload" 
        />

        {/* 3. سكريبت Monetag (للـ 5 إعلانات المتبقية) */}
        {/* ملاحظة: قمت بالإبقاء على المعرف الخاص بك 10400479 كما في الكود السابق */}
        <Script 
          src="//libtl.com/sdk.js" 
          data-zone="10400479" 
          data-sdk="show_10400479" 
          strategy="lazyOnload"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
