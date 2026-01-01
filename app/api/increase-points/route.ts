import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawId = body.telegramId || body.id;
        const telegramId = parseInt(rawId);

        if (isNaN(telegramId)) {
            return NextResponse.json({ success: false, message: "ID غير صالح" });
        }

        const { action, price, productTitle } = body;

        // 1. كسب نقاط من إعلان
        if (action === 'watch_ad') {
            const user = await prisma.user.update({
                where: { telegramId },
                data: { points: { increment: 1 }, adsCount: { increment: 1 } }
            });

            await prisma.transaction.create({
                data: {
                    telegramId,
                    type: 'ad',
                    description: 'مشاهدة إعلان مكافأة',
                    amount: 1,
                    status: 'completed'
                }
            });

            return NextResponse.json({ success: true, points: user.points, newPoints: user.points, newCount: user.adsCount });
        }

        // 2. شراء منتج
        if (action === 'purchase_product') {
            const user = await prisma.user.findUnique({ where: { telegramId } });
            if (!user || user.points < price) return NextResponse.json({ success: false, message: "رصيد غير كافٍ" });

            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: { points: { decrement: price } }
            });

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

        // 3. الدخول الأولي
        const user = await prisma.user.upsert({
            where: { telegramId },
            update: { username: body.username, firstName: body.first_name, photoUrl: body.photo_url },
            create: { telegramId, username: body.username, firstName: body.first_name, photoUrl: body.photo_url, points: 0, adsCount: 0 }
        });

        return NextResponse.json({ success: true, points: user.points, count: user.adsCount });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, message: "Error" });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const telegramId = parseInt(searchParams.get('telegramId') || "");
        if (isNaN(telegramId)) return NextResponse.json({ success: false });

        const history = await prisma.transaction.findMany({
            where: { telegramId },
            orderBy: { createdAt: 'desc' },
            take: 15
        });
        return NextResponse.json({ success: true, history });
    } catch (e) { return NextResponse.json({ success: false }); }
}
