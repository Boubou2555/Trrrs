import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const telegramId = Number(body.telegramId || body.id)

        if (!telegramId) {
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
        }

        // --- 1. منطق تفعيل كود الهدية ---
        if (body.action === 'use_gift_code') {
            const codeInput = parseInt(body.code)
            if (isNaN(codeInput)) {
                return NextResponse.json({ success: false, message: 'يرجى إدخال أرقام فقط' })
            }

            const gift = await prisma.giftCode.findUnique({ where: { code: codeInput } })
            if (!gift) return NextResponse.json({ success: false, message: 'كود غير صحيح' })
            if (gift.currentUses >= gift.maxUses) return NextResponse.json({ success: false, message: 'انتهى حد الاستخدام' })

            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: { points: { increment: gift.points } }
            })

            await prisma.giftCode.update({
                where: { code: codeInput },
                data: { currentUses: { increment: 1 } }
            })

            return NextResponse.json({ success: true, newPoints: updatedUser.points, message: `مبروك! +${gift.points} XP` })
        }

        // --- 2. منطق مشاهدة الإعلان مع تصفير العداد اليومي ---
        if (body.action === 'watch_ad') {
            const MAX_ADS = 3;
            const now = new Date();

            const currentUser = await prisma.user.findUnique({ where: { telegramId } });
            if (!currentUser) return NextResponse.json({ success: false, message: 'المستخدم غير موجود' });

            // حساب هل نحن في يوم جديد؟
            const lastDate = new Date(currentUser.lastAdDate);
            const isNewDay = now.toDateString() !== lastDate.toDateString();

            let currentAdsCount = isNewDay ? 0 : currentUser.adsCount;

            if (currentAdsCount >= MAX_ADS) {
                return NextResponse.json({ success: false, message: 'عد غداً، انتهت مهام اليوم' });
            }

            // تحديث البيانات: إذا كان يوم جديد نصفر العداد، وإذا نفس اليوم نزيد 1
            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: {
                    points: { increment: 1 },
                    adsCount: isNewDay ? 1 : { increment: 1 },
                    lastAdDate: now // تحديث تاريخ آخر مشاهدة
                }
            });

            return NextResponse.json({
                success: true,
                points: updatedUser.points,
                newCount: updatedUser.adsCount,
                message: '+1 XP'
            });
        }

        // --- 3. منطق الدخول (جلب أو إنشاء المستخدم) ---
        let user = await prisma.user.findUnique({ where: { telegramId } })
        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId,
                    username: body.username || '',
                    firstName: body.first_name || body.firstName || '',
                    lastName: body.last_name || body.lastName || '',
                    points: 0,
                    adsCount: 0
                }
            })
        }

        return NextResponse.json(user)

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
