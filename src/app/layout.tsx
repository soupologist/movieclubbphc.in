// app/layout.tsx
import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Movie Club, BITS Hyderabad',
  description: 'The filmmaking and review club of BITS Hyderabad.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-gotham bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
