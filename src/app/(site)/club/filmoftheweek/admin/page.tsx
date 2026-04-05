import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/fotw/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - Film of the Week',
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
    redirect('/club/filmoftheweek');
  }
  return <AdminDashboard />;
}
