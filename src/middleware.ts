import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/auth/login', '/auth/reset'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isApi = pathname.startsWith('/api');

  const jwtCookieName = process.env.JWT_COOKIE_NAME || 'app_token';
  const rawToken = request.cookies.get(jwtCookieName)?.value;

  let userId: string | null = null;
  if (rawToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(rawToken, secret);
      const id = (payload as { id?: unknown }).id;
      userId = typeof id === 'string' ? id : null;
    } catch {
      userId = null;
    }
  }

  if (userId) {
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/topics', request.url));
    }

    if (isApi) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', userId);
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    }

    return NextResponse.next();
  }

  if (!isPublicRoute) {
    if (isApi) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)']
};
