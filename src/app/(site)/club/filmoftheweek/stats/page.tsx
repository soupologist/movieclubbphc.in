import dbConnect from '@/lib/dbConnect';
import { FOTWSeason } from '@/lib/fotw/schemas';
import FOTWStatsClient from '@/components/fotw/FOTWStatsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Film of the Week Stats',
};

export default async function FOTWAdminStatsPage() {
  await dbConnect();
  
  const seasons = await FOTWSeason.find({}).sort({ startDate: -1 }).lean();
  
  const serializedSeasons = seasons.map(s => ({
    _id: s._id.toString(),
    name: s.name,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate ? s.endDate.toISOString() : null,
    isActive: s.isActive,
  }));

  return <FOTWStatsClient initialSeasons={serializedSeasons} />;
}
