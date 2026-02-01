import AdminDashboard from '@/components/fotw/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - Film of the Week',
};

export default function Page() {
  return <AdminDashboard />;
}
