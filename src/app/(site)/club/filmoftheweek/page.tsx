import FOTWDashboard from '@/components/fotw/FOTWDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Film of the Week | Movie Club',
};

export default function Page() {
  return <FOTWDashboard />;
}
