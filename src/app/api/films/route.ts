// app/api/films/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FilmModel from "@/models/Film";

export async function GET() {
  await dbConnect();
  const films = await FilmModel.find({}).lean();
  return NextResponse.json(films);
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const film = await FilmModel.create(body);
  return NextResponse.json(film, { status: 201 });
}
