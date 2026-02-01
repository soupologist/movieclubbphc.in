import { cookies } from 'next/headers';
import PasswordGate from '@/components/fotw/PasswordGate';
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

  const cookieStore = await cookies();
  const authorized = cookieStore.get('fotw_authorized')?.value === 'true';

  if (!authorized) {
    return <PasswordGate />;
  }

  return <div className="min-h-screen bg-black pt-20 px-4 max-w-7xl mx-auto">{children}</div>;
}
