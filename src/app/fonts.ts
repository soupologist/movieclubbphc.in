// fonts.ts
import localFont from 'next/font/local';
import { Instrument_Serif } from 'next/font/google';

export const gotham = localFont({
  src: [
    {
      path: '../public/fonts/Gotham-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Gotham-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Gotham-Bold.woff2',
      weight: '700',
      style: 'bold',
    },
  ],
  variable: '--font-gotham',
  display: 'swap',
});

export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});
