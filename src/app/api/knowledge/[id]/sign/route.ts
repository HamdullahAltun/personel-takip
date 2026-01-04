import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { signature } = await req.json();

        // Check if already signed
        const existing = await prisma.docSignature.findUnique({
            where: {
                docId_userId: {
                    docId: id,
                    userId: session.id as string
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Already signed' }, { status: 400 });
        }

        const sign = await prisma.docSignature.create({
            data: {
                docId: id,
                userId: session.id as string,
                signature: signature,
                signedAt: new Date()
            }
        });

        return NextResponse.json(sign);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sign failed' }, { status: 500 });
    }
}
