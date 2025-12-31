import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    if (!telegramId) return NextResponse.json({ success: false, message: 'ID missing' })

    // تحديث أو إنشاء المستخدم
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: body.username, firstName: body.first_name || body.firstName },
      create: { telegramId, username: body.username, firstName: body.first_name || body.firstName, points: 0 }
    })

    // --- معالجة كود الهدية ---
    if (body.action === 'use_gift_code') {
      const codeInput = body.code?.trim()
      
      const gift = await prisma.giftCode.findUnique({ where: { code: codeInput } })
      
      if (!gift) return NextResponse.json({ success: false, message: 'هذا الكود غير صحيح' })
      if (gift.currentUses >= gift.maxUses) return NextResponse.json({ success: false, message: 'انتهت صلاحية الكود' })

      // تحديث النقاط وعداد الكود في وقت واحد
      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({ where: { telegramId }, data: { points: { increment: gift.points } } }),
        prisma.giftCode.update({ where: { code: codeInput }, data: { currentUses: { increment: 1 } } })
      ])

      return NextResponse.json({ 
        success: true, 
        newPoints: updatedUser.points, 
        message: `تم التفعيل! حصلت على ${gift.points} XP` 
      })
    }

    // --- معالجة الإعلانات ---
    if (body.action === 'watch_ad') {
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: 1 }, adsCount: { increment: 1 }, lastAdDate: new Date() }
      })
      return NextResponse.json({ success: true, points: updated.points, newCount: updated.adsCount })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ success: false, message: 'خطأ في الربط مع قاعدة البيانات' }, { status: 500 })
  }
}
