import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is /admin or starts with /admin/
  if (pathname.startsWith('/admin')) {
    // Check for admin cookie
    const adminCookie = request.cookies.get('admin_password');
    const adminPassword = process.env.ADMIN_PASSWORD;

    // If no password is set in env, allow access (development mode)
    if (!adminPassword) {
      return NextResponse.next();
    }

    // If cookie doesn't match, redirect to login
    if (!adminCookie || adminCookie.value !== adminPassword) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
