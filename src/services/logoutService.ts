const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'app_token';

export function logoutService() {
  return {
    cookieName: JWT_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0
    }
  };
}
