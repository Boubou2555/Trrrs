import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // 1. التحقق من وجود المعرف الأساسي (Telegram ID)
        const telegramId = Number(body.telegramId || body.id)
        if (!telegramId) {
            return NextResponse.json({ error: 'بيانات المستخدم غير صالحة' }, { status: 400 })
        }

        // --- وظيفة: تفعيل كود الهدية ---
        if (body.action === 'use_gift_code') {
            const codeInput = parseInt(body.code)

            if (isNaN(codeInput)) {
                return NextResponse.json({ success: false, message: 'يرجى إدخال أرقام فقط' })
            }

            const gift = await prisma.giftCode.findUnique({
                where: { code: codeInput }
            })

            if (!gift) {
                return NextResponse.json({ success: false, message: 'كود رقمي غير صحيح' })
            }

            if (gift.currentUses >= gift.maxUses) {
                return NextResponse.json({ success: false, message: 'انتهى حد استخدام الكود' })
            }

            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: { points: { increment: gift.points } }
            })

            await prisma.giftCode.update({
                where: { code: codeInput },
                data: { currentUses: { increment: 1 } }
            }).catch(() => console.log("خطأ بسيط في تحديث الكود"))

            return NextResponse.json({ 
                success: true, 
                newPoints: updatedUser.points, 
                message: `مبروك! حصلت على ${gift.points} XP` 
            })
        }

        // --- وظيفة: مكافأة مشاهدة الإعلان ---
        if (body.action === 'watch_ad') {
            const MAX_ADS = 3;
            const now = new Date();

            const currentUser = await prisma.user.findUnique({
                where: { telegramId }
            });

            if (!currentUser) {
                return NextResponse.json({ success: false, message: 'المستخدم غير موجود' });
            }

            // التحقق هل نحن في يوم جديد لتصفير العداد؟
            const isNewDay = now.toDateString() !== new Date(currentUser.lastAdDate).toDateString();
            
            let currentCount = isNewDay ? 0 : currentUser.adsCount;

            if (currentCount >= MAX_ADS) {
                return NextResponse.json({ success: false, message: 'لقد استنفدت محاولات اليوم، عد غداً' });
            }

            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: { 
                    points: { increment: 1 },
