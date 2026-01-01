import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // تحويل الـ ID إلى رقم (Int) كما هو محدد في Prisma Schema الخاص بك
        const rawId = body.telegramId || body.id;
        const telegramId = parseInt(rawId);

        if (isNaN(telegramId)) {
            return NextResponse.json({ success: false, message: "ID غير صالح" });
        }

        const { action, price, productTitle } = body;

        // --- 1. حالة مشاهدة الإعلان ---
        if (action === 'watch_ad') {
            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: { 
                    points: { increment: 1 },
                    adsCount: { increment: 1 } 
                }
            });

            // تسجيل العملية في السجل تلقائياً
            await prisma.transaction.create({
                data: {
                    telegramId,
                    type: 'ad',
                    description: 'مشاهدة إعلان مكافأة',
                    amount: 1,
                    status: 'completed'
                }
            });

            return NextResponse.json({ 
                success: true, 
                points: updatedUser.points, 
                newCount: updatedUser.adsCount,
                newPoints: updatedUser.points 
            });
        }

        // --- 2. حالة شراء منتج ---
        if (action === 'purchase_product') {
            const user = await prisma.user.findUnique({ where: { telegramId } });
            
            if (!user || user.points < price) {
                return NextResponse.json({ success: false, message: "رصيدك غير كافٍ" });
            }

            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: { points: { decrement: price } }
            });

            // تسجيل عملية الشراء بحالة "قيد المعالجة"
            await prisma.transaction.create({
                data: {
                    telegramId,
                    type: 'purchase',
                    description: `شراء: ${productTitle}`,
                    amount: -price,
                    status: 'pending'
                }
            });

            return NextResponse.json({ success: true, newPoints: updatedUser.points });
        }

        // --- 3. تسجيل الدخول الأولي (عند فتح التطبيق) ---
        const user = await prisma.user.upsert({
            where: { telegramId },
            update: {
                username: body.username,
                firstName: body.first_name,
                photoUrl: body.photo_url
            },
            create: {
                telegramId,
                username: body.username,
                firstName: body.first_name,
                photoUrl: body.photo_url,
                points: 0,
                adsCount: 0
            }
        });

        return NextResponse.json({ 
            success: true, 
            points: user.points, 
            count: user.adsCount 
        });

    } catch (e) {
        console.error("API Error:", e);
        return NextResponse.json({ success: false, message: "Internal Server Error" });
    }
}

// دالة GET لجلب سجل العمليات فقط
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const rawId = searchParams.get('telegramId');
        const telegramId = parseInt(rawId || "");

        if (isNaN(telegramId)) {
            return NextResponse.json({ success: false, message: "Invalid ID" });
        }

        const history = await prisma.transaction.findMany({
            where: {
