import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    if (!telegramId) return NextResponse.json({ success: false, message: 'ID missing' })

    // --- منطق كود الهدية (نسخة مطابقة لآلية الإعلان) ---
    if (body.action === 'use_gift_code') {
      const codeInput = body.code?.trim()
      
      // 1. البحث عن الكود (قراءة فقط)
      const gift = await prisma.giftCode.findUnique({ 
        where: { code: codeInput } 
      })
      
      if (!gift) return NextResponse.json({ success: false, message: 'هذا الكود غير صحيح' })

      // 2. إضافة النقاط (استخدام نفس أسلوب تحديث الإعلانات تماماً)
      const reward = Number(gift.points) || 0
      
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { 
          points: { increment: reward } // نفس السطر المستخدم في الإعلانات
        }
      })

      // 3. تحديث الكود (اختياري، نضعه في try منفصل لضمان عدم توقف العملية)
      try {
        await prisma.giftCode.update({
          where: { code: codeInput },
          data: { currentUses: { increment: 1 } }
        })
      } catch (e) { console.log("تحديث الكود فشل لكن النقاط أضيفت") }

      return NextResponse.json({ 
        success: true, 
        newPoints: updatedUser.points, 
        message: `تمت الإضافة بنجاح! +${reward} XP` 
      })
    }

    // --- منطق الإعلانات (الذي يعمل عندك بنجاح) ---
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

    // الدخول العادي وتحديث البيانات
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

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: 'خطأ في العملية - تأكد من بيانات الكود في MongoDB' 
    }, { status: 500 })
  }
}
