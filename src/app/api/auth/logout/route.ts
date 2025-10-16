
import { NextResponse } from 'next/server';
import { logoutService } from 'src/services/logoutService';


export async function POST() {
  const response = NextResponse.json({ success: true });
  const { cookieName, cookieOptions } = logoutService();
  response.cookies.set(cookieName, '', cookieOptions);
  return response;
}

