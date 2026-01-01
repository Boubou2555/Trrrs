import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_ID = 5149849049; 

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, telegramId, amount, transactionId, adminId } = body;

        // إدارة المسؤول
        if (adminId === ADMIN_ID) {
            if (action === 'admin_add_points') {
                const updated = await prisma.user.update({
                    where: { telegramId: parseInt(telegramId) },
                    data: { points: { increment: parseInt(amount) } }
                });
                return NextResponse.json({ success: true, newPoints: updated.points });
            }
            if (action === 'complete_order') {
                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: 'completed' }
                });
                return NextResponse.json({ success: true });
            }
        }

        const userId = parseInt(body.telegramId || body.id);

        if (action === 'watch_ad') {
            const user = await prisma.user.update({
                where: { telegramId: userId },
                data: { points: { increment: 1 }, adsCount: { increment: 1 } }
            });
            await prisma.transaction.create({
                data: { telegramId: userId, type: 'ad', description: 'مكافأة إعلان', amount: 1, status: 'completed' }
            });
            return NextResponse.json({ success: true, newPoints: user.points, newCount: user.adsCount });
        }

        if (action === 'purchase_product') {
            const user = await prisma.user.update({
                where: { telegramId: userId },
                data: { points: { decrement: body.price } }
            });
            await prisma.transaction.create({
                data: { telegramId: userId, type: 'purchase', description: `شراء: ${body.productTitle}`, amount: -body.price, status: 'pending' }
            });
            return NextResponse.json({ success: true, newPoints: user.points });
        }

        const user = await prisma.user.upsert({
            where: { telegramId: userId },
            update: { username: body.username, firstName: body.first_name },
            create: { telegramId: userId, username: body.username, firstName: body.first_name, points: 0, adsCount: 0 }
        });
        return NextResponse.json({ success: true, points: user.points, count: user.adsCount });

    } catch (e) { return NextResponse.json({ success: false }); }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const adminId = parseInt(searchParams.get('adminId') || "0");
    const userId = parseInt(searchParams.get('telegramId') || "0");

    try {
        if (adminId === ADMIN_ID) {
            const orders = await prisma.transaction.findMany({
                where: { status: 'pending' },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json({ success: true, orders });
        }

        const history = await prisma.transaction.findMany({
            where: { telegramId: userId },
            orderBy: { createdAt: 'desc' },
            take: 15
        });
        return NextResponse.json({ success: true, history });
    } catch (e) { return NextResponse.json({ success: false }); }
}
