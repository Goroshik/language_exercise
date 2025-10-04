import {PrismaClient} from "src/generated/prisma";

import NextAuth, {AuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {compare, hashSync} from "bcryptjs"; // если хочешь хранить хэш пароля
import {cookies} from "next/headers";
import {SignJWT} from "jose";


const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {label: "Email", type: "text"},
        password: {label: "Password", type: "password"},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: {email: credentials.email},
        });

        console.log(credentials?.email);

        if (!user) return null;

        // Если пароли в базе в чистом виде (для теста):
        // if (credentials.password !== user.password) return null;

        console.log(hashSync(credentials.password))

        // Если пароли захэшированы bcrypt:
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {id: user.id + "", email: user.email};
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt", // 🔥 только JWT, без таблицы Session
  },
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.id = (user as any).id;

        // Create custom JWT token and save to cookie
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
        const customToken = await new SignJWT({ userId: user.id })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('7d')
          .setIssuedAt()
          .sign(secret);

        // Save token to cookies
        const cookieStore = cookies();
        cookieStore.set('auth-token', customToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/'
        });
      }
      return token;
    },
    async session({session, token}) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export {handler as GET, handler as POST};
