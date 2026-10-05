import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/auth/login', '/auth/forgot-password', '/login'];
// Doctors cannot sign up (accounts are created by the clinic): any register URL goes to login.
const registerRoutes = ['/register', '/auth/register', '/signup', '/auth/signup'];

export function proxy(request: NextRequest) {
    const token = request.cookies.get('doctor_token')?.value;
    const role = request.cookies.get('doctor_role')?.value;
    const path = request.nextUrl.pathname;

    if (registerRoutes.some(route => path === route || path.startsWith(`${route}/`))) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    // 🔒 1. If NOT logged in → redirect
    if (!token && !isAuthRoute) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 🔒 2. Doctor-only routes
    if (token && role !== 'doctor') {
        if (!isAuthRoute && path !== '/unauthorized') {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // 🔁 3. Prevent logged-in users from accessing auth pages
    if (isAuthRoute && token && role) {
        if (role === 'doctor') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next|favicon.ico|manifest.webmanifest|manifest.json|assets|icons).*)'],
};