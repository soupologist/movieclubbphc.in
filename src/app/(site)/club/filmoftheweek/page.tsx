import FOTWLandingPage from '@/components/fotw/FOTWLandingPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Film of the Week | Movie Club',
};

export default function Page() {
  return <FOTWLandingPage />;
}
