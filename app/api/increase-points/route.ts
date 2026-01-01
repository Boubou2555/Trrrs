import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_ID = 5149849049; // ⚠️ ضع ID تليجرام الخاص بك هنا

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, telegramId, amount, transactionId, adminId } = body;

        // --- وظائف المسؤول ---
        if (adminId === ADMIN_ID) {
            // 1. إضافة نقاط يدوياً لمستخدم
            if (action === 'admin_add_points') {
                const updated = await prisma.user.update({
                    where: { telegramId: parseInt(telegramId) },
                    data: { points: { increment: parseInt(amount) } }
                });
                return NextResponse.json({ success: true, newPoints: updated.points });
            }
            // 2. تغيير حالة الطلب إلى مكتمل
            if (action === 'complete_order') {
                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'completed' }
                });
                return NextResponse.json({ success: true });
            }
        }

        // --- وظائف المستخدم العادي ---
        const rawId = body.telegramId || body.id;
        const userId = parseInt(rawId);

        if (action === 'watch_ad') {
            const user = await prisma.user.update({
                where: { telegramId: userId },
                data: { points: { increment: 1 }, adsCount: { increment: 1 } }
            });
            await prisma.transaction.create({
                data: { telegramId: userId, type: 'ad', description: 'مكافأة إعلان', amount: 1, status: 'completed' }
            });
            return NextResponse.json({ success: true, points: user.points, newPoints: user.points, newCount: user.adsCount });
        }

        if (action === 'purchase_product') {
            const { price, productTitle } = body;
            const user = await prisma.user.update({
                where: { telegramId: userId },
                data: { points: { decrement: price } }
            });
            await prisma.transaction.create({
                data: { telegramId: userId, type: 'purchase', description: `شراء: ${productTitle}`, amount: -price, status: 'pending' }
            });
            return NextResponse.json({ success: true, newPoints: user.points });
        }

        // الدخول الأولي
        const user = await prisma.user.upsert({
            where: { telegramId: userId },
            update: { username: body.username, firstName: body.first_name },
            create: { telegramId: userId, username: body.username, firstName: body.first_name, points: 0 }
        });
        return NextResponse.json({ success: true, points: user.points, count: user.adsCount });

    } catch (e) { return NextResponse.json({ success: false }); }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('telegramId') || "0");
    const adminId = parseInt(searchParams.get('adminId') || "0");

    try {
        // إذا كان المسؤول يطلب البيانات
        if (adminId === ADMIN_ID) {
            const pendingOrders = await prisma.transaction.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json({ success: true, orders: pendingOrders });
        }
        // جلب سجل المستخدم العادي
        const history = await prisma.transaction.findMany({
            where: { telegramId: userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return NextResponse.json({ success: true, history, count: (await prisma.user.findUnique({where:{telegramId:userId}}))?.adsCount });
    } catch (e) { return NextResponse.json({ success: false }); }
}
