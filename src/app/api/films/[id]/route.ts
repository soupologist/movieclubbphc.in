// app/api/films/[id]/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FilmModel from '@/models/Film';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();

  const film = await FilmModel.findOne({ id: params.id }).lean();

  if (!film) {
    return NextResponse.json({ error: 'Film not found' }, { status: 404 });
  }

  const serialized = {
    ...film,
    _id: film._id.toString(),
    credits: film.credits ?? [],
    awards: film.awards ?? [],
    notes: film.notes ?? [],
    btsPhotos: film.btsPhotos ?? [],
  };

  return NextResponse.json(serialized);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();

  const data = await req.json();
  const updated = await FilmModel.findOneAndUpdate({ id: params.id }, data, {
    new: true,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Film not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Film updated' });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();

  const deleted = await FilmModel.findOneAndDelete({ id: params.id });

  if (!deleted) {
    return NextResponse.json({ error: 'Film not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Film deleted' });
}
