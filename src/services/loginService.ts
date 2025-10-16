import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { userRepository } from 'src/repository/client';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '***REMOVED***');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'app_token';

export async function loginService(email: string, password: string) {
  if (!email || !password) {
    return { success: false, error: 'Email и пароль обязательны', status: 400 };
  }
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Неверные данные', status: 401 };
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { success: false, error: 'Неверные данные', status: 401 };
  }
  const jwt = await new SignJWT({ id: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
  return { success: true, jwt };
}
