import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb'; // تأكد من مسار ملف الاتصال بمونجو

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { telegramId, id, action, price, productTitle } = body;
        const finalId = telegramId || id;

        const client = await clientPromise;
        const db = client.db("telegram_app");

        // 1. معالجة مشاهدة الإعلانات
        if (action === 'watch_ad') {
            // تحديث نقاط المستخدم
            await db.collection("users").updateOne(
                { telegramId: finalId },
                { $inc: { points: 1, dailyAdsCount: 1 } },
                { upsert: true }
            );

            // تسجيل العملية في السجل تلقائياً
            await db.collection("transactions").insertOne({
                telegramId: finalId,
                type: 'ad',
                description: 'مشاهدة إعلان مكافأة',
                amount: 1,
                status: 'completed',
                createdAt: new Date()
            });

            const user = await db.collection("users").findOne({ telegramId: finalId });
            return NextResponse.json({ success: true, newPoints: user.points, newCount: user.dailyAdsCount });
        }

        // 2. معالجة شراء منتج
        if (action === 'purchase_product') {
            // خصم النقاط من المستخدم
            const result = await db.collection("users").updateOne(
                { telegramId: finalId, points: { $gte: price } },
                { $inc: { points: -price } }
            );

            if (result.modifiedCount === 0) {
                return NextResponse.json({ success: false, message: "رصيدك غير كافٍ" });
            }

            // تسجيل عملية الشراء في السجل بحالة "pending" تلقائياً
            const transaction = {
                telegramId: finalId,
                type: 'purchase',
                description: `شراء: ${productTitle}`,
                amount: -price,
                status: 'pending', // ستظهر للمستخدم "قيد المعالجة"
                createdAt: new Date(),
                transactionId: Math.random().toString(36).substr(2, 9).toUpperCase()
            };

            await db.collection("transactions").insertOne(transaction);

            const user = await db.collection("users").findOne({ telegramId: finalId });
            return NextResponse.json({ success: true, newPoints: user.points });
        }

        return NextResponse.json({ success: false, message: "Action not found" });

    } catch (e) {
        return NextResponse.json({ success: false, message: "Server Error" });
    }
}

// دالة GET لجلب السجل لعرضه في تبويب History
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) return NextResponse.json({ success: false });

    const client = await clientPromise;
    const db = client.db("telegram_app");

    // جلب آخر 20 عملية للمستخدم مرتبة من الأحدث للأقدم
    const history = await db.collection("transactions")
        .find({ telegramId: telegramId })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();

    return NextResponse.json({ success: true, history });
}
