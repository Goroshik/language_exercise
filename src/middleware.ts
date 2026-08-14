import { NextRequest, NextResponse } from 'next/server';
import { decideRoute, jwtCookieName, userIdFromToken } from 'src/utils/authRouting';

function withUserHeader(request: NextRequest, userId: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.set('x-user-id', userId);
  return NextResponse.next({ request: { headers } });
}

function unauthorized(): NextResponse {
  return new NextResponse(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

function redirect(request: NextRequest, to: string, callbackUrl?: string): NextResponse {
  const url = new URL(to, request.url);
  if (callbackUrl) {
    url.searchParams.set('callbackUrl', callbackUrl);
  }
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get(jwtCookieName())?.value;
  const action = decideRoute(pathname, await userIdFromToken(rawToken));

  switch (action.kind) {
    case 'inject-user':
      return withUserHeader(request, action.userId);
    case 'unauthorized':
      return unauthorized();
    case 'redirect':
      return redirect(request, action.to, action.callbackUrl);
    default:
      return NextResponse.next();
  }
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)']
};
