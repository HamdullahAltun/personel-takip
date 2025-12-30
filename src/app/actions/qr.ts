"use server";

import { signJWT } from "@/lib/auth";

export async function generateOfficeToken(lat?: number, lng?: number) {
    // We create a short-lived token containing the Office location and timestamp
    // We reuse signJWT but maybe with a shorter expiration or specific payload

    // Format: OFFICE|TIMESTAMP|LAT|LNG
    // But we want it tamper proof.
    // Let's just sign a JWT with this info.

    const payload = {
        type: 'OFFICE_QR',
        timestamp: Date.now(),
        location: (lat && lng) ? { lat, lng } : null
    };

    // Sign with 1 minute expiration to enforce rotation
    return await signJWT(payload, '1m');
}

import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";

export async function generateUserToken() {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) throw new Error("Unauthorized");

    const user = await verifyJWT(token);
    if (!user) throw new Error("Unauthorized");

    const payload = {
        type: 'USER_QR',
        userId: user.id,
        timestamp: Date.now()
    };
    // Sign with 1 minute expiration
    return await signJWT(payload, '15m');
}
