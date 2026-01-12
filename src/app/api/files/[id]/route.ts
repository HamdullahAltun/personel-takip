import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const storedFile = await prisma.storedFile.findUnique({
            where: { id }
        });

        if (!storedFile) {
            return new NextResponse("File not found", { status: 404 });
        }

        // Return the binary data with correct content type
        return new NextResponse(storedFile.data, {
            headers: {
                'Content-Type': storedFile.contentType,
                'Content-Disposition': `inline; filename="${storedFile.filename}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
            }
        });

    } catch (error) {
        console.error("File Fetch Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
