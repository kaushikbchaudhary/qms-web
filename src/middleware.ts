// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth/auth';
import { getRedirectPath, hasAccess, resolveRoleKey } from '@/lib/auth/access';
import { UserRole } from '@/config/roles';

const AUTH_ROUTES = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];
const PUBLIC_ROUTES = ['/register', '/about', '/notifications-sw.js'];
const PUBLIC_ROUTE_PREFIXES = ['/uploads'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute =
        isAuthRoute ||
        PUBLIC_ROUTES.includes(pathname) ||
        PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    const token = request.cookies.get('jwt_qms');
    const user: any = token ? verifyJwt(token.value) : null;

    // Allow public/auth routes when not authenticated
    if (!token || !user || typeof user.role === 'undefined') {
        if (isPublicRoute) {
            const response = NextResponse.next();
            response.headers.set('x-middleware-cache', 'no-store');
            return response;
        }
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Handle roles array (your token shows role as array)
    const rawRoles = (Array.isArray(user.role) ? user.role : [user.role]).filter(Boolean);
    const normalizedRoles = rawRoles
        .map((role: string) => resolveRoleKey(role))
        .filter((role: UserRole | undefined): role is UserRole => Boolean(role));

    if (normalizedRoles.length === 0) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const redirectPath = getRedirectPath(normalizedRoles);
    const redirectUrl = new URL(
        redirectPath.startsWith('/')
            ? redirectPath
            : `/${redirectPath}`,
        request.url
    );

    // Prevent authenticated users from accessing auth routes
    if (isAuthRoute) {
        return NextResponse.redirect(redirectUrl);
    }

    // Check access
    if (!hasAccess(pathname, normalizedRoles)) {
        if (redirectUrl.pathname === pathname) {
            return NextResponse.next();
        }
        return NextResponse.redirect(redirectUrl);
    }

    const response = NextResponse.next();
    response.headers.set('x-middleware-cache', 'no-store');
    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next|favicon.ico).*)', // Excludes API & static files
    ],
};
