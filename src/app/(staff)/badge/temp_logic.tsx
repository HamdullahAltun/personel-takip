"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2 } from "lucide-react";
import { generateUserToken } from "@/app/actions/qr";

export default function BadgePage() {
    const [qrValue, setQrValue] = useState("");
    const [timeLeft, setTimeLeft] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let timerId: NodeJS.Timeout;

        const updateQR = async () => {
            // We need the user ID. But since we are client side, we can't get cookie easily.
            // We can pass it via props if this was a child, or fetch it.
            // Actually, the Server Action `generateUserToken` can read the cookie itself!
            // Wait, `generateUserToken` takes userId as arg in my current impl.
            // Let's modify `generateUserToken` to read from cookie.
        };
        // Wait, I can't modify the server action to read cookie if I want it to be pure?
        // No, Server Actions CAN read cookies.
        // Let's modify `generateUserToken` to NOT take an ID, but read 'personel_token' from context.
        return () => { };
    }, []);

    // ... 
    // Wait, the better approach is:
    // Make this a Client Component that calls a Server Action which gets the current User from Cookie and returns the signed token.

    return <div>Implementing...</div>
}
