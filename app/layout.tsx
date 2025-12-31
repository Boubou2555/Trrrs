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
    <html lang="en">
      <body className={inter.className}>
        {/* سكربت تليجرام الأساسي */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        
        {/* سكربت Monetag - تأكد من الرابط الخاص بك من لوحة التحكم */}
        <Script 
          src="https://alwingulla.com/88/p.js" 
          data-ghi="10400479" 
          strategy="lazyOnload" // لضمان عدم تأخير تحميل التطبيق
        />
        
        {children}
      </body>
    </html>
  )
}
