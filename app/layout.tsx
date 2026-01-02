import type { Metadata } from "next"
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = { title: 'XP STORE', description: 'XP STORE APP' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {/* الرابط الرسمي من لقطة الشاشة: sad.min.js */}
        <Script src="https://sad.adsgram.ai/js/sad.min.js" strategy="beforeInteractive" />
        <Script src="//libtl.com/sdk.js" data-zone="10400479" data-sdk="show_10400479" strategy="lazyOnload" />
      </head>
      <body>{children}</body>
    </html>
  )
}
