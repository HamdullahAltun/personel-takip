import { prisma } from "./prisma";

/**
 * Converts a base64 Data URL to a StoredFile and returns the access URL.
 * If the input is already a URL or doesn't look like base64, returns it as is.
 */
export async function saveBase64ToFile(base64Data: string, filename: string): Promise<string> {
    if (!base64Data || !base64Data.startsWith('data:')) {
        return base64Data;
    }

    try {
        // Parse Data URL: data:[<mediatype>][;base64],<data>
        const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return base64Data;

        const contentType = match[1];
        const buffer = Buffer.from(match[2], 'base64');

        const storedFile = await prisma.storedFile.create({
            data: {
                filename,
                contentType,
                data: buffer,
            }
        });

        return `/api/files/${storedFile.id}`;
    } catch (error) {
        console.error("Failed to save base64 to file:", error);
        return base64Data;
    }
}
