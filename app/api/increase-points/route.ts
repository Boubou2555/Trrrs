import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_ID = 5149849049;
const MAX_ADS = 10;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, telegramId, amount, transactionId, adminId, reason, status, title, message } = body;
        const userId = parseInt(telegramId || body.id);

        if (action === 'read_notifs') {
            await prisma.notification.updateMany({ where: { telegramId: userId, isRead: false }, data: { isRead: true } });
            return NextResponse.json({ success: true });
        }

        if (adminId === ADMIN_ID) {
            if (action === 'manage_points') {
                const val = parseInt(amount);
                const updated = await prisma.user.update({ where: { telegramId: userId }, data: { points: { increment: val } } });
                await prisma.transaction.create({ data: { telegramId: userId, type: 'admin', description: val > 0 ? '🎁 مكافأة من المسوؤل' : '⚠️ خصم من المسؤول', amount: val, status: 'completed' } });
                return NextResponse.json({ success: true, points: updated.points });
            }
            if (action === 'send_notif') {
                await prisma.notification.create({ data: { telegramId: userId, title, message } });
                return NextResponse.json({ success: true });
            }
            if (action === 'update_order') {
                await prisma.transaction.update({ where: { id: transactionId }, data: { status: status } });
                return NextResponse.json({ success: true });
            }
            if (action === 'toggle_ban') {
                await prisma.user.update({ where: { telegramId: userId }, data: { status: status === 'ban' ? 1 : 0, banReason: status === 'ban' ? reason : "" } });
                return NextResponse.json({ success: true });
            }
        }

        const checkUser = await prisma.user.findUnique({ where: { telegramId: userId } });
        if (checkUser?.status === 1 && action !== 'login_check') return NextResponse.json({ success: false, banned: true, reason: checkUser.banReason });

        if (action === 'watch_ad') {
            if (checkUser && checkUser.adsCount >= MAX_ADS) return NextResponse.json({ success: false });
            const user = await prisma.user.update({ where: { telegramId: userId }, data: { points: { increment: 1 }, adsCount: { increment: 1 } } });
            await prisma.transaction.create({ data: { telegramId: userId, type: 'ad', description: 'مشاهدة إعلان', amount: 1, status: 'completed' } });
            return NextResponse.json({ success: true, newPoints: user.points, newAdsCount: user.adsCount });
        }

        if (action === 'purchase_product') {
            const user = await prisma.user.update({ where: { telegramId: userId }, data: { points: { decrement: body.price } } });
            await prisma.transaction.create({ data: { telegramId: userId, type: 'purchase', description: `طلب: ${body.productTitle}`, amount: -body.price, status: 'pending' } });
            return NextResponse.json({ success: true, newPoints: user.points });
        }

        const user = await prisma.user.upsert({
            where: { telegramId: userId },
            update: { username: body.username, firstName: body.first_name, photoUrl: body.photo_url },
            create: { telegramId: userId, username: body.username, firstName: body.first_name, photoUrl: body.photo_url, points: 0, adsCount: 0 }
        });
        return NextResponse.json({ success: true, points: user.points, banned: user.status === 1, reason: user.banReason, user });
    } catch (e) { return NextResponse.json({ success: false }); }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('telegramId') || "0");
    const action = searchParams.get('action');

    // دالة مشاهدة الإعلان
    if (action === 'watch_ad' && userId > 0) {
        const checkUser = await prisma.user.findUnique({ where: { telegramId: userId } });
        if (checkUser && checkUser.adsCount < MAX_ADS) {
            await prisma.user.update({ where: { telegramId: userId }, data: { points: { increment: 1 }, adsCount: { increment: 1 } } });
            return new Response('OK', { status: 200 });
        }
    }

    const adminId = parseInt(searchParams.get('adminId') || "0");
    
    // التعديل هنا لربط بيانات المستخدم بالطلبات
    if (adminId === ADMIN_ID) {
        const orders = await prisma.transaction.findMany({ 
            where: { status: 'pending' }, 
            orderBy: { createdAt: 'desc' },
            include: { user: true } // هذا السطر هو الذي يجلب الاسم واليوزر من جدول المستخدمين
        });
        const users = await prisma.user.findMany({ orderBy: { points: 'desc' }, take: 100 });
        return NextResponse.json({ success: true, orders, users });
    }
    
    const userData = await prisma.user.findUnique({ where: { telegramId: userId } });
    const history = await prisma.transaction.findMany({ where: { telegramId: userId }, orderBy: { createdAt: 'desc' }, take: 20 });
    const notifs = await prisma.notification.findMany({ where: { telegramId: userId }, orderBy: { createdAt: 'desc' }, take: 15 });
    
    return NextResponse.json({ 
        success: true, 
        points: userData?.points || 0, // إضافة لإرسال النقاط مباشرة
        user: userData, 
        history, 
        notifs 
    });
}
