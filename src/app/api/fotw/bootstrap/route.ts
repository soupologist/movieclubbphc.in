import { NextResponse } from 'next/server';
import { GET as getData } from '../data/route';
import { GET as getArchive } from '../archive/route';
import { GET as getSeasons } from '../seasons/route';

export async function GET(req: Request) {
  try {
    const [dataRes, archiveRes, seasonsRes] = await Promise.all([
      getData(req),
      getArchive(req),
      getSeasons()
    ]);

    // Check for non-200 responses and bubble them up
    if (!dataRes.ok) return dataRes;
    if (!archiveRes.ok) return archiveRes;
    if (!seasonsRes.ok) return seasonsRes;

    const [data, archive, seasons] = await Promise.all([
      dataRes.json(),
      archiveRes.json(),
      seasonsRes.json()
    ]);

    return NextResponse.json({
      data,
      archive,
      seasons: seasons.seasons || []
    });
  } catch (error) {
    console.error('Bootstrap API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
