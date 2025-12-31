import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    if (!telegramId) return NextResponse.json({ success: false, message: 'ID missing' })

    // --- منطق كود الهدية (التعامل مع الكود كـ رقم Int32) ---
    if (body.action === 'use_gift_code') {
      // تحويل المدخل من التطبيق إلى رقم
      const codeInput = Number(body.code)
      
      if (isNaN(codeInput)) {
        return NextResponse.json({ success: false, message: 'يرجى إدخال أرقام فقط' })
      }

      // البحث عن الكود في قاعدة البيانات (حيث الكود مخزن كـ Number)
      const gift = await prisma.giftCode.findFirst({ 
        where: { 
          code: codeInput 
        } 
      })
      
      if (!gift) return NextResponse.json({ success: false, message: 'هذا الكود الرقمي غير صحيح' })

      // إضافة النقاط (نفس آلية الإعلانات الناجحة عندك)
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { 
          points: { increment: Number(gift.points) } 
        }
      })

      // محاولة تحديث عداد الاستخدام (اختياري)
      try {
        await prisma.giftCode.update({
          where: { id: gift.id },
          data: { currentUses: { increment: 1 } }
        })
      } catch (e) { console.log("Update skipped") }

      return NextResponse.json({ 
        success: true, 
        newPoints: updatedUser.points, 
        message: `تم الشحن بنجاح! +${gift.points} XP` 
      })
    }

    // --- منطق الإعلانات (المستقر والناجح) ---
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

    // الدخول العادي
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: body.username, firstName: body.first_name || body.firstName },
      create: { telegramId, username: body.username, firstName: body.first_name || body.firstName, points: 0 }
    })
    return NextResponse.json(user)

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ success: false, message: 'خطأ في العملية: تأكد من إعدادات MongoDB' })
  }
}
