import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_ID = 5149849049;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, telegramId, amount, transactionId, adminId, reason, status } = body;

        // --- نظام الإدارة للمسؤول ---
        if (adminId === ADMIN_ID) {
            if (action === 'manage_points') {
                const updated = await prisma.user.update({
                    where: { telegramId: parseInt(telegramId) },
                    data: { points: { increment: parseInt(amount) } }
                });
                return NextResponse.json({ success: true, points: updated.points });
            }
            if (action === 'update_order') {
                await prisma.transaction.update({
                    where: { id: transactionId },
                    data: { status: status } // 'completed' or 'rejected'
                });
                return NextResponse.json({ success: true });
            }
            if (action === 'toggle_ban') {
                await prisma.user.update({
                    where: { telegramId: parseInt(telegramId) },
                    data: { status: status === 'ban' ? 1 : 0, banReason: reason || "" }
                });
                return NextResponse.json({ success: true });
            }
        }

        // --- عمليات المستخدم العادي ---
        const userId = parseInt(body.telegramId || body.id);
        
        // التحقق من الحظر
        const checkUser = await prisma.user.findUnique({ where: { telegramId: userId } });
        if (checkUser?.status === 1) {
            return NextResponse.json({ success: false, banned: true, reason: checkUser.banReason });
        }

        if (action === 'purchase_product') {
            const user = await prisma.user.update({
                where: { telegramId: userId },
                data: { points: { decrement: body.price } }
            });
            await prisma.transaction.create({
                data: { 
                    telegramId: userId, 
                    type: 'purchase', 
                    description: `طلب: ${body.productTitle} (من: ${body.first_name || 'مستخدم'})`, 
                    amount: -body.price, 
                    status: 'pending' 
                }
            });
            return NextResponse.json({ success: true, newPoints: user.points });
        }

        // تسجيل الدخول وتحديث البيانات
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

    if (adminId === ADMIN_ID) {
        const orders = await prisma.transaction.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });
        const users = await prisma.user.findMany({ orderBy: { points: 'desc' }, take: 30 });
        return NextResponse.json({ success: true, orders, users });
    }
    
    const userId = parseInt(searchParams.get('telegramId') || "0");
    const history = await prisma.transaction.findMany({ where: { telegramId: userId }, orderBy: { createdAt: 'desc' }, take: 15 });
    return NextResponse.json({ success: true, history });
}
