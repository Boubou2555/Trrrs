import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telegramId = Number(searchParams.get('telegramId'));
  if (!telegramId) return NextResponse.json({ error: 'ID مطلوب' }, { status: 400 });

  try {
    let user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await prisma.user.create({
        data: { telegramId, points: 0, adsCount: 0, status: 0 }
      });
    }
    const now = new Date();
    const lastAdDate = user.lastAdDate ? new Date(user.lastAdDate) : new Date(0);
    const isNewDay = now.toDateString() !== lastAdDate.toDateString();
    const currentCount = isNewDay ? 0 : (user.adsCount || 0);

    return NextResponse.json({ success: true, count: currentCount, points: user.points });
  } catch (error) {
    return NextResponse.json({ error: 'خطأ خادم' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const telegramId = Number(body.telegramId || body.userId || body.id);

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: body.username, firstName: body.first_name || body.firstName },
      create: { telegramId, username: body.username, firstName: body.first_name || body.firstName, points: 0, adsCount: 0, status: 0 }
    });

    if (user.status === 1) return NextResponse.json({ error: 'محظور' }, { status: 403 });

    // --- 1. شحن الكود ---
    if (body.action === 'redeem_code') {
      const inputCode = String(body.code).trim().replace(/\s+/g, '');
      const giftCode = await prisma.giftCode.findFirst({ where: { code: inputCode } });

      if (!giftCode) return NextResponse.json({ success: false, message: '❌ الكود غير صحيح' });
      if (giftCode.currentUses >= giftCode.maxUses) return NextResponse.json({ success: false, message: '⚠️ انتهى الكود' });

      const alreadyUsed = await prisma.usedCode.findFirst({
        where: { userId: telegramId, codeId: giftCode.id }
      });
      if (alreadyUsed) return NextResponse.json({ success: false, message: '⚠️ استخدمته سابقاً' });

      const updated = await prisma.$transaction([
        prisma.user.update({ where: { telegramId }, data: { points: { increment: giftCode.points } } }),
        prisma.usedCode.create({ data: { userId: telegramId, codeId: giftCode.id } }),
        prisma.giftCode.update({ where: { id: giftCode.id }, data: { currentUses: { increment: 1 } } })
      ]);
      return NextResponse.json({ success: true, message: `✅ تم شحن ${giftCode.points} نقطة`, points: updated[0].points });
    }

    // --- 2. مشاهدة إعلان ---
    if (body.action === 'watch_ad') {
      const now = new Date();
      const lastAdDate = user.lastAdDate ? new Date(user.lastAdDate) : new Date(0);
      const isNewDay = now.toDateString() !== lastAdDate.toDateString();
      let currentCount = isNewDay ? 0 : (user.adsCount || 0);

      if (currentCount >= 3) return NextResponse.json({ success: false, message: 'انتهت المحاولات' });

      const updated = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: 1 }, adsCount: currentCount + 1, lastAdDate: now }
      });
      return NextResponse.json({ success: true, newCount: updated.adsCount, points: updated.points });
    }

    // --- 3. شراء منتج ---
    if (body.action === 'purchase_product') {
      if (user.points < body.price) return NextResponse.json({ success: false, message: 'رصيد غير كافٍ' });
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { points: { decrement: body.price } }
      });
      return NextResponse.json({ success: true, newPoints: updated.points });
    }

    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
