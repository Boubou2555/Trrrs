import type { Metadata } from "next"
import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Telegram Mini App',
  description: 'A simple Telegram mini app using Next.js and Prisma',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* 1. سكربت تليجرام الأساسي - يتم تحميله قبل التفاعل */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
        
        {/* 2. سكربت Monetag SDK - تم تحديثه بناءً على بيانات منطقتك (Zone 10400479) */}
        {/* نستخدم استراتيجية beforeInteractive لضمان جاهزية دالة show_10400479 فور تحميل الصفحة */}
        <Script 
          src="//libtl.com/sdk.js" 
          data-zone="10400479" 
          data-sdk="show_10400479"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
