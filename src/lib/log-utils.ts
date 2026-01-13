import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Sanitizes an object for logging by truncating long strings (like base64 images).
 */
export function sanitize(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
    }

    const sanitized: Record<string, unknown> = {};
    const source = obj as Record<string, unknown>;

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const value = source[key];
            if (typeof value === 'string' && value.length > 1000) {
                sanitized[key] = value.substring(0, 50) + `... [TRUNCATED ${value.length} chars]`;
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitize(value);
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
}

export async function logInfo(message: string, obj?: unknown, level: string = 'INFO') {
    const sanitizedObj = obj ? sanitize(obj) : null;
    
    // Console Log
    if (sanitizedObj) {
        console.log(`[${level}] ${message}:`, JSON.stringify(sanitizedObj, null, 2));
    } else {
        console.log(`[${level}] ${message}`);
    }

    // DB Log
    try {
        await prisma.systemLog.create({
            data: {
                level,
                message,
                metadata: (sanitizedObj as Prisma.InputJsonValue) || {} 
            }
        });
    } catch (e) {
        console.error("Failed to write SystemLog to DB:", e);
    }
}

export async function logError(message: string, error?: unknown) {
    await logInfo(message, error, 'ERROR');
}
