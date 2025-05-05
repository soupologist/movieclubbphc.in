import '../globals.css';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Movie Club, BITS Hyderabad',
  description: 'The filmmaking and review club of BITS Hyderabad.',
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-gotham bg-black text-white">
        <Navbar />
        <main className="pt-20 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
