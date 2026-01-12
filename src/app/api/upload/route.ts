import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getFirebaseStorage } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate Type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: `Geçersiz dosya formatı. Lütfen JPG, PNG veya GIF kullanın.` }, { status: 400 });
        }

        // Validate Size (Max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "Dosya boyutu 10MB'dan küçük olmalıdır." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}_${uuidv4()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

        try {
            // Try Firebase Storage (Cloud)
            const storage = await getFirebaseStorage();
            const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
            const blob = bucket.file(`uploads/${filename}`);

            await blob.save(buffer, {
                metadata: { contentType: file.type },
            });

            // Make public (requires storage permissions)
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/uploads/${filename}`;

            return NextResponse.json({ url: publicUrl });

        } catch (storageError: any) {
            console.warn("Cloud Storage preferred but failed or not configured. Falling back to local (only works in non-serverless):", storageError.message);

            // Fallback to local only for local development
            if (process.env.NODE_ENV === 'development') {
                const { writeFile, mkdir } = await import("fs/promises");
                const path = await import("path");
                const uploadDir = path.join(process.cwd(), "public/uploads");
                await mkdir(uploadDir, { recursive: true });
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                return NextResponse.json({ url: `/uploads/${filename}` });
            }

            throw storageError; // Rethrow in production so we know it's a real issue
        }

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }
}
