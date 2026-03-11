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
        } catch {
          // KV not configured — fall through to hardcoded demo fallback below
        }

        if (storedUser) {
          const passwordMatch = await bcrypt.compare(password, storedUser.password);
          if (!passwordMatch) return null;
          return { id: storedUser.id, email: storedUser.email, name: storedUser.name };
        }

        // Hardcoded demo fallback (used in local dev without KV env vars).
        // Remove this block once KV is provisioned and seed-demo-user.ts has been run.
        const DEMO_USERS = [
          { email: 'admin@mlh.com', password: 'mlh', id: 'user-mlh', name: 'MLH Fellow' },
          { email: 'admin@nexar.ai', password: 'admin123', id: 'user-nexar', name: 'Admin User' },
        ];
        const demo = DEMO_USERS.find((u) => u.email === email && u.password === password);
        if (demo) return { id: demo.id, email: demo.email, name: demo.name };

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
