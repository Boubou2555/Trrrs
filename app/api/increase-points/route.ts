import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    if (!telegramId) return NextResponse.json({ success: false, message: 'ID missing' })

    // --- منطق كود الهدية (مطابق تماماً لآلية الإعلان الناجحة عندك) ---
    if (body.action === 'use_gift_code') {
      const codeInput = body.code?.trim() // تنظيف الكود المدخل من المسافات
      
      // البحث عن الكود
      const gift = await prisma.giftCode.findFirst({ 
        where: { 
          code: {
            contains: codeInput, // استخدام contains لتجنب مشاكل المسافات الزائدة في قاعدة البيانات
            mode: 'insensitive'
          }
        } 
      })
      
      if (!gift) return NextResponse.json({ success: false, message: 'هذا الكود غير صحيح' })

      // إضافة النقاط (نفس السطر الذي نجح في الإعلانات)
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { 
          points: { increment: gift.points } 
        }
      })

      // محاولة تحديث عداد الكود في الخلفية (حتى لو فشلت لن تتوقف العملية)
      prisma.giftCode.update({
        where: { id: gift.id },
        data: { currentUses: { increment: 1 } }
      }).catch(e => console.log("Update gift uses failed, but points added."))

      return NextResponse.json({ 
        success: true, 
        newPoints: updatedUser.points, 
        message: `تم تفعيل الهدية! +${gift.points} XP` 
      })
    }

    // --- منطق الإعلانات (الذي يعمل بنجاح كما في صورتك) ---
    if (body.action === 'watch_ad') {
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { 
          points: { increment: 1 }, 
          adsCount: { increment: 1 }, 
          lastAdDate: new Date() 
        }
      })
      return NextResponse.json({ success: true, points: updated.points, newCount: updated.adsCount })
    }

    // تسجيل الدخول العادي
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: body.username, firstName: body.first_name || body.firstName },
      create: { telegramId, username: body.username, firstName: body.first_name || body.firstName, points: 0 }
    })
    return NextResponse.json(user)

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ success: false, message: 'خطأ في العملية: تأكد من بيانات الكود' }, { status: 500 })
  }
}
