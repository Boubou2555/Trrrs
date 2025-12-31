import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_ADS = 3;

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: body.username, firstName: body.first_name || body.firstName },
      create: { telegramId, username: body.username, firstName: body.first_name || body.firstName, points: 0 }
    })

    if (body.action === 'use_gift_code') {
      const gift = await prisma.giftCode.findUnique({ where: { code: body.code } })
      
      if (!gift) return NextResponse.json({ success: false, message: 'هذا الكود غير موجود' })
      if (gift.currentUses >= gift.maxUses) return NextResponse.json({ success: false, message: 'انتهت صلاحية الكود' })

      const updated = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: gift.points } }
      })
      await prisma.giftCode.update({
        where: { code: body.code },
        data: { currentUses: { increment: 1 } }
      })
      
      return NextResponse.json({ 
        success: true, 
        newPoints: updated.points, 
        message: `تم تفعيل الكود! حصلت على ${gift.points} XP` 
      })
    }

    if (body.action === 'watch_ad') {
      // ... منطق الإعلانات كما هو ...
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: 1 }, adsCount: { increment: 1 }, lastAdDate: new Date() }
      })
      return NextResponse.json({ success: true, points: updated.points, newCount: updated.adsCount })
    }

    return NextResponse.json(user)
  } catch (e) {
    return NextResponse.json({ success: false, message: 'خطأ في السيرفر' }, { status: 500 })
  }
}
