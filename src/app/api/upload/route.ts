import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logInfo, logError } from "@/lib/log-utils";

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate Size (Max 15.5MB for MongoDB limit of 16MB)
        if (file.size > 15 * 1024 * 1024) {
            return NextResponse.json({ error: "Dosya boyutu MongoDB limiti (16MB) nedeniyle 15MB'dan küçük olmalıdır." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Save to Database
        const storedFile = await prisma.storedFile.create({
            data: {
                filename: file.name,
                contentType: file.type,
                data: buffer
            }
        });

        logInfo(`File uploaded by ${session.id}`, { id: storedFile.id, filename: storedFile.filename });

        // Return a public URL pointing to our fetcher route
        return NextResponse.json({
            url: `/api/files/${storedFile.id}`,
            id: storedFile.id
        });

    } catch (error: any) {
        logError("Database Upload Error", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
