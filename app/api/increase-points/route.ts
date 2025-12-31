import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    if (!telegramId) return NextResponse.json({ success: false, message: 'ID missing' })

    // 1. منطق كود الهدية (التركيز على منح النقاط أولاً)
    if (body.action === 'use_gift_code') {
      const codeInput = body.code?.trim()
      
      // البحث عن الكود
      const gift = await prisma.giftCode.findUnique({ where: { code: codeInput } })
      
      if (!gift) return NextResponse.json({ success: false, message: 'هذا الكود غير صحيح' })
      if (gift.currentUses >= gift.maxUses) return NextResponse.json({ success: false, message: 'انتهت صلاحية الكود' })

      // منح النقاط للمستخدم (عملية مستقلة لضمان النجاح)
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: gift.points } }
      })

      // محاولة تحديث عداد استخدام الكود (بشكل منفصل حتى لا يعطل منح النقاط)
      try {
        await prisma.giftCode.update({
          where: { code: codeInput },
          data: { currentUses: { increment: 1 } }
        })
      } catch (e) {
        console.log("فشل تحديث عداد الكود ولكن تم منح النقاط")
      }

      return NextResponse.json({ 
        success: true, 
        newPoints: updatedUser.points, 
        message: `تم التفعيل! حصلت على ${gift.points} XP` 
      })
    }

    // 2. منطق الإعلانات (كما هو ظاهر في صورك أنه يعمل)
    if (body.action === 'watch_ad') {
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: 1 }, adsCount: { increment: 1 }, lastAdDate: new Date() }
      })
      return NextResponse.json({ success: true, points: updated.points, newCount: updated.adsCount })
    }

    // 3. تحديث بيانات المستخدم عند الدخول
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: body.username, firstName: body.first_name || body.firstName },
      create: { telegramId, username: body.username, firstName: body.first_name || body.firstName, points: 0 }
    })

    return NextResponse.json(user)

  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ success: false, message: 'خطأ في الربط: يرجى التأكد من بيانات MongoDB' }, { status: 500 })
  }
}
