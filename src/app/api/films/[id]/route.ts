// app/api/films/[id]/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FilmModel from '@/models/Film';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await dbConnect();

  const film = await FilmModel.findOne({ id }).lean();

  if (!film) {
    return NextResponse.json({ error: 'Film not found' }, { status: 404 });
  }

  const serialized = {
    ...film,
    _id: film._id.toString(),
    credits: film.credits ?? [],
    awards: film.awards ?? [],
    notes: film.notes ?? '',
    btsPhotos: film.btsPhotos ?? [],
  };

  return NextResponse.json(serialized);
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();

  const { id } = await context.params;
  const data = await req.json();

  try {
    const updated = await FilmModel.findOneAndUpdate({ id }, data, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Film not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating film:', err);
    return NextResponse.json({ error: 'Failed to update film' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();

  const deleted = await FilmModel.findOneAndDelete({ id: params.id });

  if (!deleted) {
    return NextResponse.json({ error: 'Film not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Film deleted' });
}
