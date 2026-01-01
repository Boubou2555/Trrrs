import type { Metadata } from "next"
import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Telegram Mini App',
  description: 'Borhane Test App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* سكربت تليجرام */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
        
        {/* سكربت Monetag - وضعناه بدون SDK تشغيل تلقائي لمنع الفتح العشوائي */}
        <Script 
          src="https://jsoque.com/sdk.js" 
          data-zone="10400479" 
          strategy="lazyOnload"
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
