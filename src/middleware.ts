import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create Supabase client for middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Check for auth cookies to determine if user is logged in
  const accessToken = request.cookies.get('sb-access-token');
  const refreshToken = request.cookies.get('sb-refresh-token');

  // Auto-redirect authenticated users from root or login to chat-page
  if ((accessToken || refreshToken) && (pathname === '/' || pathname === '/sign-up-login-screen')) {
    const chatUrl = new URL('/chat-page', request.url);
    return NextResponse.redirect(chatUrl);
  }

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
