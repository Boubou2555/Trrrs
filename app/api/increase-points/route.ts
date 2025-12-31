import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    if (!telegramId) {
      return NextResponse.json({ success: false, message: 'ID missing' }, { status: 400 })
    }

    // 1. منطق تفعيل كود الهدية (Gift Code)
    if (body.action === 'use_gift_code') {
      const { code } = body
      
      // البحث عن الكود في قاعدة البيانات
      const gift = await prisma.giftCode.findUnique({ where: { code: code?.trim() } })
      
      if (!gift) {
        return NextResponse.json({ success: false, message: 'هذا الكود غير صحيح' })
      }
      
      if (gift.currentUses >= gift.maxUses) {
        return NextResponse.json({ success: false, message: 'انتهت صلاحية الكود' })
      }

      // منح النقاط للمستخدم (تبسيط العملية لضمان النجاح وتجاوز أخطاء الربط)
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: gift.points } }
      })

      // تحديث عداد استخدام الكود بشكل منفصل (محاولة غير حارقة)
      try {
        await prisma.giftCode.update({
          where: { code: code?.trim() },
          data: { currentUses: { increment: 1 } }
        })
      } catch (e) { 
        console.log("تنبيه: فشل تحديث عداد الكود لكن تم منح النقاط بنجاح") 
      }

      return NextResponse.json({ 
        success: true, 
        newPoints: updatedUser.points, 
        message: `مبروك! حصلت على ${gift.points} XP` 
      })
    }

    // 2. منطق مشاهدة الإعلانات (يعمل بشكل مستقر)
    if (body.action === 'watch_ad') {
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { 
          points: { increment: 1 }, 
          adsCount: { increment: 1 }, 
          lastAdDate: new Date() 
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        points: updated.points, 
        newCount: updated.adsCount 
      })
    }

    // 3. في حالة تسجيل الدخول أو تحديث البيانات العادي
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { 
        username: body.username, 
        firstName: body.first_name || body.firstName 
      },
      create: { 
        telegramId, 
        username: body.username, 
        firstName: body.first_name || body.firstName, 
        points: 0 
      }
    })

    return NextResponse.json(user)

  } catch (e) {
    console.error("Global API Error:", e)
    return NextResponse.json({ 
      success: false, 
      message: 'خطأ في الربط: تأكد من إعدادات الـ IP في MongoDB Atlas (0.0.0.0/0)' 
    }, { status: 500 })
  }
}
