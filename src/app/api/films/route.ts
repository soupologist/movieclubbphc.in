// app/api/films/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FilmModel from '@/models/Film';

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const role = searchParams.get('role') || 'public';
  const showShelved = searchParams.get('showShelved') === 'true';

  // Determine allowed visibility levels
  const visibilityMap: Record<string, string[]> = {
    admin: ['public', 'campus', 'club', 'admin'],
    club: ['public', 'campus', 'club'],
    campus: ['public', 'campus'],
    public: ['public'],
  };
  const allowedVisibilities = visibilityMap[role] || ['public'];

  // Base query
  interface FilmQuery {
    visibility: { $in: string[] };
    status?: string | { $in: string[] };
  }

  const query: FilmQuery = {
    visibility: { $in: allowedVisibilities },
  };

  // Shelved handling
  if (showShelved) {
    if (['club', 'admin'].includes(role)) {
      // include both released and shelved
      query.status = { $in: ['released', 'shelved'] };
    } else {
      query.status = 'released';
    }
  } else {
    query.status = 'released';
  }

  const films = await FilmModel.find(query).sort({ date: -1 });
  return NextResponse.json(films);
}
export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const film = await FilmModel.create(body);
  return NextResponse.json(film, { status: 201 });
}
