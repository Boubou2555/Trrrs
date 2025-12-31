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
      <body className={inter.className}>
        {/* سكربت تليجرام الأساسي */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
        
        {/* سكربت الإعلانات - تأكد أن الرابط هو الرابط المزود لك من الشركة */}
        <Script 
          src="https://app.adsgram.ai/js/adv.js" 
          strategy="afterInteractive" 
        />

        {children}
      </body>
    </html>
  )
}
