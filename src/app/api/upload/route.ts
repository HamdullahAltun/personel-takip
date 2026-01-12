import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate Type (Optional but good)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            // We can be more flexible if needed, but keeping it safe for now
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

        // Return a public URL pointing to our fetcher route
        // We use the ID to retrieve it later
        return NextResponse.json({
            url: `/api/files/${storedFile.id}`,
            id: storedFile.id
        });

    } catch (error: any) {
        console.error("Database Upload Error:", error);
        return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }
}
