import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { rewardId } = await req.json();

        // 1. Get Reward & User
        const [reward, user] = await Promise.all([
            prisma.reward.findUnique({ where: { id: rewardId } }),
            prisma.user.findUnique({ where: { id: session.id as string } })
        ]);

        if (!reward || !reward.isActive) return NextResponse.json({ error: 'Ödül bulunamadı veya aktif değil' }, { status: 400 });
        if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 400 });

        // 2. Check Logic
        if (reward.stock !== -1 && reward.stock <= 0) {
            return NextResponse.json({ error: 'Stok tükenmiş!' }, { status: 400 });
        }

        if (user.points < reward.cost) {
            return NextResponse.json({ error: `Yetersiz Puan! (${user.points} / ${reward.cost})` }, { status: 400 });
        }

        // 3. Transaction
        // Decrease points, Decrease stock, Create Request
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { points: { decrement: reward.cost } }
            }),
            prisma.reward.update({
                where: { id: reward.id },
                data: { stock: reward.stock === -1 ? -1 : { decrement: 1 } }
            }),
            prisma.rewardRequest.create({
                data: {
                    userId: user.id,
                    rewardId: reward.id,
                    status: 'PENDING'
                }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Ödül talep edildi!' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
    }
}
