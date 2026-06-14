import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllMembers } from '@/lib/fotw/getMemberData';
import MembersList from '@/components/fotw/MembersList';

export const metadata: Metadata = {
  title: 'Members | Film of the Week | Movie Club',
};

export default async function MembersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const members = await getAllMembers();

  return <MembersList members={members} />;
}
