import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

import UserRepository from 'src/repository/user';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '***REMOVED***');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'app_token';

const userRepository = new UserRepository();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email и пароль обязательны' }, { status: 400 });
    }

    
    const user = await userRepository.getAuth(email);

    console.log(user)

    if (!user) {
      return NextResponse.json({ success: false, error: 'Неверные данные' }, { status: 401 });
    }

    console.log(email, bcrypt.hashSync(password, 10))
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Неверные данные' }, { status: 401 });
    }


    const jwt = await new SignJWT({ id: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true });
    response.cookies.set(JWT_COOKIE_NAME, jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}



