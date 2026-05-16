import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define __dirname in pure ESM without importing Node-only modules (`url` or `path`).
// This approach uses the module URL and is compatible with Edge runtimes
// (no `require` or Node built-ins needed).
// It yields the directory of the current module.
const __dirname = new URL('.', import.meta.url).pathname;

// Authentication is enabled by default
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';

// Get the JWT secret for session verification
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedRoutes = ['/chat-page'];
  const authRoutes = ['/sign-up-login-screen'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If authentication is disabled, allow all routes
  if (!AUTH_ENABLED) {
    console.warn('Warning: Authentication is disabled. This is not recommended for production.');
    return NextResponse.next();
  }

  // If accessing auth routes, allow without session
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // For protected routes, verify session
  if (isProtectedRoute) {
    try {
      // Get the session token from cookies
      const token = req.cookies.get('next-auth.session-token')?.value ||
                   req.cookies.get('__Secure-next-auth.session-token')?.value;

      if (!token) {
        console.warn(`Unauthorized access attempt to ${pathname} - no session token`);
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verify the JWT token
      try {
        await jwtVerify(token, JWT_SECRET);
        // Token is valid, allow access
        return NextResponse.next();
      } catch (jwtError) {
        console.warn(`Invalid session token for ${pathname}: ${jwtError}`);
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error(`Session verification error for ${pathname}:`, error);
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
