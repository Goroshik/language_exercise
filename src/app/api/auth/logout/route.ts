import { NextResponse } from 'next/server';

const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'app_token';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(JWT_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}



