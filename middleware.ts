import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Authentication is enabled by default.
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedRoutes = ['/chat-page'];
  const authRoutes = ['/sign-up-login-screen'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    const token = req.cookies.get('next-auth.session-token')?.value ||
                  req.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
