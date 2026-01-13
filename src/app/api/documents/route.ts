import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const where = session.role === 'ADMIN' ? {} : { userId: session.id };

    const documents = await prisma.document.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json(documents);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, type, fileUrl, userId, requiresSigning, expiryDate } = body;

    const targetUserId = userId || session.id;

    const doc = await prisma.document.create({
        data: {
            title,
            type,
            fileUrl,
            userId: targetUserId,
            requiresSigning: !!requiresSigning,
            expiryDate: expiryDate ? new Date(expiryDate) : null
        }
    });

    return NextResponse.json(doc);
}

export async function PUT(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, isSigned, signature } = await req.json();

    // Check if user owns the document or is admin
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.role !== 'ADMIN' && doc.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.document.update({
        where: { id },
        data: {
            isSigned,
            signature,
            signedAt: isSigned ? new Date() : null
        }
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
