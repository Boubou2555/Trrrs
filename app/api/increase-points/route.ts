import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// الحد الأقصى للإعلانات يومياً
const MAX_ADS = 3;

// --- وظيفة جلب البيانات (GET) ---
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const telegramId = Number(searchParams.get('telegramId'))
  
  if (!telegramId) return NextResponse.json({ error: 'ID مطلوب' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({ where: { telegramId } })
    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

    // منطق تصفير عداد الإعلانات إذا مر يوم جديد
    const now = new Date()
    const lastAdDate = user.lastAdDate ? new Date(user.lastAdDate) : new Date(0)
    const isNewDay = now.toDateString() !== lastAdDate.toDateString()
    const currentCount = isNewDay ? 0 : (user.adsCount || 0)

    return NextResponse.json({ 
      success: true, 
      count: currentCount, 
      points: user.points,
      status: user.status,
      banReason: user.banReason 
    })
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 })
  }
}

// --- وظيفة معالجة العمليات (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const telegramId = Number(body.telegramId || body.id)

    if (!telegramId) return NextResponse.json({ error: 'ID Telegram مطلوب' }, { status: 400 });

    // 1. تسجيل أو تحديث بيانات المستخدم (Upsert)
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { 
        username: body.username, 
        firstName: body.first_name || body.firstName,
        photoUrl: body.photo_url || body.photoUrl
      },
      create: { 
        telegramId, 
        username: body.username, 
        firstName: body.first_name || body.firstName, 
        points: 0, 
        adsCount: 0, 
        status: 0 
      }
    })

    // التحقق من الحظر
    if (user.status === 1) {
      return NextResponse.json({ 
        success: false, 
        error: 'محظور', 
        status: 1, 
        message: user.banReason || 'لقد تم حظرك من النظام' 
      }, { status: 403 })
    }

    // 2. منطق تفعيل كود الهدية (Gift Code)
    if (body.action === 'use_gift_code') {
      const { code } = body;
      const gift = await prisma.giftCode.findUnique({ where: { code } });

      if (!gift) {
        return NextResponse.json({ success: false, message: 'هذا الكود غير صحيح' });
      }
      if (gift.currentUses >= gift.maxUses) {
        return NextResponse.json({ success: false, message: 'انتهت صلاحية هذا الكود (وصل للحد الأقصى)' });
      }

      // زيادة نقاط المستخدم وتحديث مرات استخدام الكود
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { points: { increment: gift.points } }
      });

      await prisma.giftCode.update({
        where: { code },
        data: { currentUses: { increment: 1 } }
      });

      return NextResponse.json({ 
        success: true, 
        newPoints: updatedUser.points, 
        message: `تم تفعيل الكود! مبروك حصلت على ${gift.points} XP` 
      });
    }

    // 3. منطق مشاهدة الإعلانات
    if (body.action === 'watch_ad') {
      const now = new Date();
      const lastAdDate = user.lastAdDate ? new Date(user.lastAdDate) : new Date(0);
      const isNewDay = now.toDateString() !== lastAdDate.toDateString();
      let currentCount = isNewDay ? 0 : (user.adsCount || 0);

      if (currentCount >= MAX_ADS) {
        return NextResponse.json({ success: false, message: 'لقد استنفدت محاولاتك لليوم' });
      }

      const updated = await prisma.user.update({
        where: { telegramId },
        data: { 
          points: { increment: 1 }, 
          adsCount: currentCount + 1, 
          lastAdDate: now 
        }
      })
      return NextResponse.json({ success: true, newCount: updated.adsCount, points: updated.points })
    }

    // 4. منطق الشراء
    if (body.action === 'purchase_product') {
      if (user.points < body.price) {
        return NextResponse.json({ success: false, message: 'رصيدك غير كافٍ لإتمام العملية' });
      }
      
      const updated = await prisma.user.update({
        where: { telegramId },
        data: { points: { decrement: body.price } }
      })
      return NextResponse.json({ success: true, newPoints: updated.points })
    }

    // إذا لم يكن هناك action، نرجع بيانات المستخدم فقط (عند تسجيل الدخول)
    return NextResponse.json(user)

  } catch (e) {
    console.error("API Error:", e);
    return NextResponse.json({ success: false, message: 'حدث خطأ داخلي في السيرفر' }, { status: 500 })
  }
}
