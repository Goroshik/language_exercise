import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Skip middleware for auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;

  if (token) {
    try {
      // Verify and decode the JWT token
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
      const { payload } = await jwtVerify(token, secret);

      // Add user ID to request headers for API routes to access
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      // Token is invalid, remove it
      const response = NextResponse.next();
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // No token found, continue without user ID
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
