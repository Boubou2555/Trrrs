import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// إنشاء اتصال مباشر بقاعدة البيانات
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = Number(body.userId); 
    
    // تنظيف الكود من المسافات وتحويله لنص
    const inputCode = String(body.code).trim().replace(/\s+/g, '');

    if (!inputCode) {
      return NextResponse.json({ success: false, message: "❌ الرجاء إدخال كود" });
    }

    // البحث عن الكود في MongoDB (يدعم النص والرقم)
    const giftCode = await prisma.giftCode.findFirst({
      where: {
        OR: [
          { code: { equals: inputCode as any } },
          { code: { equals: parseInt(inputCode) as any } }
        ]
      }
    });

    if (!giftCode) {
      return NextResponse.json({ success: false, message: "❌ الكود غير صحيح" });
    }

    // التحقق من الحد الأقصى للاستخدام
    if (giftCode.currentUses >= giftCode.maxUses) {
      return NextResponse.json({ success: false, message: "⚠️ انتهت صلاحية هذا الكود" });
    }

    // التحقق هل استعمله هذا الشخص من قبل
    const alreadyUsed = await prisma.usedCode.findFirst({
      where: { 
        userId: userId,
        codeId: giftCode.id
      }
    });

    if (alreadyUsed) {
      return NextResponse.json({ success: false, message: "⚠️ لقد استخدمت هذا الكود سابقاً" });
    }

    // تنفيذ العملية في قاعدة البيانات
    await prisma.$transaction([
      prisma.user.update({
        where: { telegramId: userId },
        data: { points: { increment: giftCode.points } }
      }),
      prisma.usedCode.create({
        data: { 
          userId: userId, 
          codeId: giftCode.id 
        }
      }),
      prisma.giftCode.update({
        where: { id: giftCode.id },
        data: { currentUses: { increment: 1 } }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: `✅ مبروك! حصلت على ${giftCode.points} نقطة.` 
    });

  } catch (error: any) {
    console.error("خطأ:", error);
    return NextResponse.json({ 
      success: false, 
      message: "⚙️ خطأ في السيرفر - تأكد من DATABASE_URL" 
    });
  }
}
