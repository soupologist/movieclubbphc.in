import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { Session, NextAuthOptions } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';

// TODO: fix naming

const ADMIN_EMAILS = [
  'f20220016@hyderabad.bits-pilani.ac.in',
  'movieclub@hyderabad.bits-pilani.ac.in',
  'ronilborah@gmail.com',
];
const CLUB_EMAILS = ['f20230177@hyderabad.bits-pilani.ac.in'];
const GUEST_EMAILS = ['l.brahm@justwatch.com', 'ronilborah@gmail.com'];

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        if (user.email) {
          await dbConnect();
          await FOTWUser.findOneAndUpdate(
            { email: user.email },
            { $set: { image: user.image || '', name: user.name || 'Unknown' } }
          );
        }
      } catch (error) {
        console.error('Error updating user on sign in:', error);
      }
      return true;
    },
    async session({ session }: { session: Session }) {
      const email = session.user?.email || '';

      const isAdmin = ADMIN_EMAILS.includes(email);
      const isClub = CLUB_EMAILS.includes(email);
      const isGuest = GUEST_EMAILS.includes(email);
      const isCollege =
        email.endsWith('@hyderabad.bits-pilani.ac.in') ||
        email.endsWith('@alumni.bits-pilani.ac.in');

      session.user.role = isAdmin
        ? 'admin'
        : isClub
          ? 'club'
          : isGuest
            ? 'guest'
            : isCollege
              ? 'college'
              : 'general';

      return session;
    },
  },
};
