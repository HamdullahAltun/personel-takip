import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuth } from "@/lib/auth";

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
            console.log("Upload blocked - Invalid Type:", file.type);
            return NextResponse.json({ error: `Geçersiz dosya formatı (${file.type}). Lütfen JPG, PNG veya GIF kullanın.` }, { status: 400 });
        }

        // Validate Size (Max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "Dosya boyutu 10MB'dan küçük olmalıdır." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Sanitize filename: ASCII only, remove special chars
        const sanitizedParams = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const filename = `${Date.now()}_${sanitizedParams}`;

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
