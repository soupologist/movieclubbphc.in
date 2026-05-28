import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWUser } from '@/lib/fotw/schemas';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { authOptions } from '@/lib/auth';

/**
 * Parse a CSV string manually (no external library).
 * Handles quoted fields, newlines within quotes.
 */
function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        // handle \r\n
        if (ch === '\r' && next === '\n') i++;
        row.push(field.trim());
        field = '';
        if (row.some((c) => c !== '')) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // Last field / row
  row.push(field.trim());
  if (row.some((c) => c !== '')) rows.push(row);

  return rows;
}

const WATCH_ALIASES = new Set(['watchedcount', 'watched', 'count', 'films']);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const raw = await file.text();
    const rows = parseCSV(raw);
    if (rows.length < 2) {
      return NextResponse.json({ message: 'CSV is empty or has no data rows' }, { status: 400 });
    }

    // Parse header (case-insensitive)
    const header = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, ''));
    const nameIdx = header.indexOf('name');
    const emailIdx = header.indexOf('email');
    const watchIdx = header.findIndex((h) => WATCH_ALIASES.has(h));

    if (nameIdx === -1 || emailIdx === -1 || watchIdx === -1) {
      return NextResponse.json(
        { message: `Missing required columns. Found: ${header.join(', ')}. Need: name, email, watchedCount` },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const name = cols[nameIdx] ?? '';
      const email = cols[emailIdx] ?? '';
      const watchedRaw = cols[watchIdx] ?? '';
      const watchedCount = parseInt(watchedRaw, 10);

      if (!name || !email || isNaN(watchedCount)) {
        skipped++;
        errors.push({ row: i + 1, reason: `Missing or invalid field (name="${name}", email="${email}", watchedCount="${watchedRaw}")` });
        continue;
      }

      if (watchedCount < 0) {
        skipped++;
        errors.push({ row: i + 1, reason: 'watchedCount cannot be negative' });
        continue;
      }

      await FOTWUser.findOneAndUpdate(
        { email },
        { $set: { name, watchedCount } },
        { upsert: true, new: true }
      );
      imported++;
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error('Error importing leaderboard:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
