import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('personel_token')?.value;
    const verifiedToken = token ? await verifyJWT(token) : null;

    const { pathname } = request.nextUrl;

    // 1. Redirect to login if not authenticated and trying to access protected routes
    if (!verifiedToken && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/scan') || pathname.startsWith('/badge'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Redirect to dashboard if authenticated and trying to access login
    // 2. Redirect to dashboard if authenticated and trying to access login
    if (verifiedToken && pathname.startsWith('/login')) {
        if (verifiedToken.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (verifiedToken.role === 'EXECUTIVE') {
            // Redirect Executive to the main dashboard (integrated view)
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // 3. Protect Admin routes
    if (pathname.startsWith('/admin')) {
        if (verifiedToken?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url)); // Redirect non-admins to staff dashboard
        }
    }

    // 4. Protect Executive routes
    if (pathname.startsWith('/executive')) {
        if (verifiedToken?.role !== 'EXECUTIVE' && verifiedToken?.role !== 'ADMIN') {
            // Better to redirect as it is middleware for pages
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
