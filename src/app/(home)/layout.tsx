import '@/app/globals.css';
import React from 'react';
import Navbar from '@/components/Navbar';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Movie Club, BITS Hyderabad',
  description: 'The filmmaking and review club of BITS Hyderabad.',
  openGraph: {
    title: 'Movie Club BITS Hyderabad',
    description: 'The filmmaking and review club of BITS Hyderabad.',
    url: 'https://movieclubbphc.vercel.app',
    siteName: 'Movie Club, BITS Hyderabad',
    images: [
      {
        url: 'https://res.cloudinary.com/dlglodixp/image/upload/v1744486673/banner_cg39aj.png', // 👈 Your custom image
        width: 1200,
        height: 630,
        alt: 'Movie Club banner',
      },
    ],
    type: 'website',
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-gotham bg-black text-white">
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
