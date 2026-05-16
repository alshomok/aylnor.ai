import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Temporarily disabled to fix MIDDLEWARE_INVOCATION_FAILED error
  // TODO: Re-enable authentication when proper Edge Runtime compatible solution is implemented
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
