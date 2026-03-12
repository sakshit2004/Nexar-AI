import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        let storedUser: {
          id: string;
          email: string;
          name: string;
          password: string;
        } | null = null;

        try {
          const { kv } = await import('@/lib/kv');
          storedUser = await kv.hgetall<{
            id: string;
            email: string;
            name: string;
            password: string;
          }>(`user:${email}`);
        } catch (error) {
          console.error('Auth: KV lookup failed:', error);
        }

        if (storedUser) {
          const passwordMatch = await bcrypt.compare(password, storedUser.password);
          if (!passwordMatch) return null;
          return { id: storedUser.id, email: storedUser.email, name: storedUser.name };
        }

        // Fail closed when KV is unavailable or user not found.
        return null;
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
});
