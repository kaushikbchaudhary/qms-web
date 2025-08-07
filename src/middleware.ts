// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {verifyJwt} from "@/lib/auth/auth";
import {getRedirectPath, hasAccess} from "@/lib/auth/access";

const PUBLIC_ROUTES = ['/auth/login', '/register', '/about'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
        // return NextResponse.next();
        const response = NextResponse.next();
        response.headers.set('x-middleware-cache', 'no-store');
        return response;
    }

    const token = request.cookies.get('jwt_qms');
    if (!token) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const user:any = verifyJwt(token?.value);
    if (!user || typeof user.role === 'undefined') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Handle roles array (your token shows role as array)
    const userRoles = typeof user.role !== 'undefined' && Array.isArray(user.role) ? user.role : [user.role];

    const redirectPath = getRedirectPath(userRoles);
    const redirectUrl = new URL(
        redirectPath.startsWith('/')
            ? redirectPath
            : `/${redirectPath}`,
        request.url
    );

    // Check access
    if (!hasAccess(pathname, userRoles)) {
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



