import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // التحقق من وجود المعرف
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
            }).catch(() => console.log("Skip gift update error"))

            return NextResponse.json({ 
                success: true, 
                newPoints: updatedUser.points, 
                message: `مبروك! حصلت على ${gift.points} XP` 
            })
        }

        // --- 2. منطق مشاهدة الإعلان (الجديد) ---
        if (body.action === 'watch_ad') {
            const MAX_ADS = 3; // يجب أن يتطابق مع الرقم في Frontend
            
            const currentUser = await prisma.user.findUnique({
                where: { telegramId }
            });

            if (!currentUser) {
                return NextResponse.json({ success: false, message: 'المستخدم غير موجود' });
            }

            // التحقق من عدد الإعلانات المشاهدة
            if (currentUser.adsCount >= MAX_ADS) {
                return NextResponse.json({ success: false, message: 'لقد أكملت جميع المهام اليومية' });
            }

            // تحديث النقاط وعداد الإعلانات
            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: { 
                    points: { increment: 1 }, // زيادة 1 XP
                    adsCount: { increment: 1 } // زيادة عداد المشاهدة
                }
            });

            return NextResponse.json({ 
                success: true, 
                points: updatedUser.points, 
                newCount: updatedUser.adsCount,
                message: '+1 XP تم منح المكافأة' 
            });
        }

        // --- 3. منطق تسجيل الدخول أو جلب البيانات ---
        let user = await prisma.user.findUnique({
            where: { telegramId }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: telegramId,
                    username: body.username || '',
                    firstName: body.first_name || body.firstName || '',
                    lastName: body.last_name || body.lastName || '',
                    points: 0,
                    adsCount: 0 // تأكد من إضافة هذا الحقل في Prisma Schema
                }
            })
        }

        return NextResponse.json(user)

    } catch (error) {
        console.error('Error processing request:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
