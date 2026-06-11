import FOTWLandingPage from '@/components/fotw/FOTWLandingPage';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBootstrapData } from '@/lib/fotw/getBootstrapData';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Film of the Week | Movie Club',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Fetch the initial bootstrap data server-side
  const initialData = await getBootstrapData(session.user.email);

  return <FOTWLandingPage initialData={initialData} />;
}
