import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getMemberProfile } from '@/lib/fotw/getMemberData';
import UserProfile from '@/components/fotw/UserProfile';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getMemberProfile(decodeURIComponent(params.username));
  if (!profile) return { title: 'Member Not Found | Film of the Week' };

  return {
    title: `${profile.name} | Film of the Week | Movie Club`,
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const username = decodeURIComponent(params.username);
  const profile = await getMemberProfile(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl mb-6">
        <Link 
          href="/club/filmoftheweek/members"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>
      </div>
      <UserProfile profile={profile} />
    </div>
  );
}
