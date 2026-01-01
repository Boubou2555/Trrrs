import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_ID = 5149849049;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, telegramId, amount, transactionId, adminId, reason, status } = body;
        const userId = parseInt(telegramId || body.id);

        // 1. نظام الإدارة للمسؤول
        if (adminId === ADMIN_ID) {
            if (action === 'manage_points') {
                const updated = await prisma.user.update({
                    where: { telegramId: userId },
                    data: { points: { increment: parseInt(amount) } }
                });
                return NextResponse.json({ success: true, points: updated.points });
            }
            if (action === 'update_order') {
                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: status }
                });
                return NextResponse.json({ success: true });
            }
            if (action === 'toggle_ban') {
                await prisma.user.update({
                    where: { telegramId: userId },
                    data: { status: status === 'ban' ? 1 : 0, banReason: reason || "" }
                });
                return NextResponse.json({ success: true });
            }
        }

        // 2. التحقق من الحظر للمستخدم العادي
        const checkUser = await prisma.user.findUnique({ where: { telegramId: userId } });
        if (checkUser?.status === 1) {
            return NextResponse.json({ success: false, banned: true, reason: checkUser.banReason });
        }

        // 3. إضافة نقاط الإعلانات (Page1)
        if (action === 'watch_ad') {
            const updatedUser = await prisma.user.update({
                where: { telegramId: userId },
                data: { points: { increment: 1 }, adsCount: { increment: 1 } }
            });
            await prisma.transaction.create({
                data: { telegramId: userId, type: 'ad', description: 'مكافأة مشاهدة إعلان', amount: 1, status: 'completed' }
            });
            return NextResponse.json({ success: true, newPoints: updatedUser.points });
        }

        // 4. شراء منتج
        if (action === 'purchase_product') {
            const user = await prisma.user.update({
                where: { telegramId: userId },
                data: { points: { decrement: body.price } }
            });
            await prisma.transaction.create({
                data: { 
                    telegramId: userId, 
                    type: 'purchase', 
                    description: `طلب: ${body.productTitle} (المستخدم: ${body.first_name})`, 
                    amount: -body.price, 
                    status: 'pending' 
                }
            });
            return NextResponse.json({ success: true, newPoints: user.points });
        }

        // 5. تسجيل الدخول الأولي
        const user = await prisma.user.upsert({
            where: { telegramId: userId },
            update: { username: body.username, firstName: body.first_name, photoUrl: body.photo_url },
            create: { telegramId: userId, username: body.username, firstName: body.first_name, photoUrl: body.photo_url, points: 0 }
        });
        
        return NextResponse.json({ success: true, points: user.points });
    } catch (e) { return NextResponse.json({ success: false }); }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const adminId = parseInt(searchParams.get('adminId') || "0");
    const userId = parseInt(searchParams.get('telegramId') || "0");

    try {
        if (adminId === ADMIN_ID) {
            const orders = await prisma.transaction.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });
            const users = await prisma.user.findMany({ orderBy: { points: 'desc' }, take: 50 });
            return NextResponse.json({ success: true, orders, users });
        }
        const history = await prisma.transaction.findMany({ where: { telegramId: userId }, orderBy: { createdAt: 'desc' }, take: 20 });
        return NextResponse.json({ success: true, history });
    } catch (e) { return NextResponse.json({ success: false }); }
}
