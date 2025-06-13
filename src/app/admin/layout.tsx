import '../globals.css';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Movie Club, BITS Hyderabad',
  description: 'Admin dashboard for the Movie Club, BITS Hyderabad.',
  openGraph: {
    title: 'Admin | Movie Club BITS Hyderabad',
    description: 'Admin dashboard for managing content on the Movie Club website.',
    url: 'https://movieclubbphc.vercel.app/admin',
    siteName: 'Movie Club Admin, BITS Hyderabad',
    images: [
      {
        url: 'https://res.cloudinary.com/dlglodixp/image/upload/v1744486673/banner_cg39aj.png',
        width: 1200,
        height: 630,
        alt: 'Movie Club banner',
      },
    ],
    type: 'website',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-gotham bg-black text-white">
        <Navbar />
        <main className="pt-20 pb-16 min-h-screen">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
