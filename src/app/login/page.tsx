'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/admin');
    }
  }, [status, router]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Login to Movie Club BPHC</h1>

        <button
          onClick={() => signIn('google')}
          className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200 transition mb-10"
        >
          Sign in with Google
        </button>

        <p>Use your BITS Email for access to club or campus exclusive content.</p>
      </main>

      <Footer />
    </div>
  );
}
