import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { Session } from 'next-auth';

const ADMIN_EMAILS = [
  'f20220016@hyderabad.bits-pilani.ac.in',
  'movieclub@hyderabad.bits-pilani.ac.in',
];
const CLUB_EMAILS = ['f20230177@hyderabad.bits-pilani.ac.in'];

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session }: { session: Session }) {
      const email = session.user?.email || '';

      const isAdmin = ADMIN_EMAILS.includes(email);
      const isClub = CLUB_EMAILS.includes(email);
      const isCollege = email.endsWith('@hyderabad.bits-pilani.ac.in');

      session.user.role = isAdmin ? 'admin' : isClub ? 'club' : isCollege ? 'college' : 'general';

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
