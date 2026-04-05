import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Film of the Week | Movie Club BPHC',
};

export default async function FOTWLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/club/filmoftheweek');
  }

  const email = session.user?.email || '';
  const isCollege = email.endsWith('@hyderabad.bits-pilani.ac.in');
  
  // Allow admins and club members without the college email
  const role = (session.user as any)?.role;
  const isAuthorized = isCollege || role === 'admin' || role === 'club';

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Access Denied</h2>
        <p className="text-[#678] text-center text-sm">
          You must be signed in with an @hyderabad.bits-pilani.ac.in email to access Film of the Week.
        </p>
      </div>
    );
  }

  return <div className="min-h-screen bg-black pt-20 px-4 max-w-7xl mx-auto">{children}</div>;
}
