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

        // --- 1. منطق تفعيل كود الهدية (الجديد) ---
        if (body.action === 'use_gift_code') {
            const codeInput = parseInt(body.code) // تحويل الكود المدخل لرقم (Int)

            if (isNaN(codeInput)) {
                return NextResponse.json({ success: false, message: 'يرجى إدخال أرقام فقط' })
            }

            // البحث عن الكود في جدول GiftCode
            const gift = await prisma.giftCode.findUnique({
                where: { code: codeInput }
            })

            if (!gift) {
                return NextResponse.json({ success: false, message: 'كود رقمي غير صحيح' })
            }

            if (gift.currentUses >= gift.maxUses) {
                return NextResponse.json({ success: false, message: 'انتهى حد استخدام الكود' })
            }

            // تحديث نقاط المستخدم وزيادة عداد الكود
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

        // --- 2. منطق تسجيل الدخول (الكود القديم الخاص بك مع تعديل) ---
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
                    points: 0
                }
            })
        }

        return NextResponse.json(user)

    } catch (error) {
        console.error('Error processing request:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
