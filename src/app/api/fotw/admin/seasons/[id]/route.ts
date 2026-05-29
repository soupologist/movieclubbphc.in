import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { FOTWSeason } from '@/lib/fotw/schemas';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';

// ---------------------------------------------------------------------------
// PATCH /api/fotw/admin/seasons/:id
// Allows updating name, startDate, endDate, isActive on any season.
// Validation mirrors POST: endDate must be after startDate if both present.
// Promoting a season (isActive: true) demotes all others first.
// ---------------------------------------------------------------------------
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const [session] = await Promise.all([getServerSession(authOptions), dbConnect()]);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Season id is required' }, { status: 400 });
    }

    const body = await req.json();
    const { name, startDate, endDate, isActive, letterboxdUrl } = body as {
      name?: string;
      startDate?: string;
      endDate?: string | null;
      isActive?: boolean;
      letterboxdUrl?: string;
    };

    const updates: Record<string, unknown> = {};

    if (letterboxdUrl !== undefined) {
      updates.letterboxdUrl = letterboxdUrl.trim();
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ message: 'name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    let parsedStart: Date | undefined;
    let parsedEnd: Date | null | undefined;

    if (startDate !== undefined) {
      parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json({ message: 'Invalid startDate' }, { status: 400 });
      }
      updates.startDate = parsedStart;
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        parsedEnd = null;
        updates.endDate = null;
      } else {
        parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return NextResponse.json({ message: 'Invalid endDate' }, { status: 400 });
        }
        updates.endDate = parsedEnd;
      }
    }

    // Cross-field date validation — we may need to read the existing doc if
    // only one of the two dates is being updated.
    const needsDateCheck =
      parsedStart !== undefined || parsedEnd !== undefined;

    if (needsDateCheck) {
      const existing = await FOTWSeason.findById(id).select('startDate endDate').lean();
      if (!existing) {
        return NextResponse.json({ message: 'Season not found' }, { status: 404 });
      }

      const effectiveStart = parsedStart ?? existing.startDate;
      const effectiveEnd = parsedEnd !== undefined ? parsedEnd : existing.endDate;

      if (effectiveEnd !== null && effectiveEnd <= effectiveStart) {
        return NextResponse.json(
          { message: 'endDate must be after startDate' },
          { status: 400 }
        );
      }
    }

    if (isActive !== undefined) {
      updates.isActive = isActive;
      // Promoting this season: demote all others
      if (isActive) {
        await FOTWSeason.updateMany(
          { _id: { $ne: id }, isActive: true },
          { $set: { isActive: false } }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await FOTWSeason.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Season not found' }, { status: 404 });
    }

    return NextResponse.json({ season: updated });
  } catch (err) {
    console.error('[admin/seasons/:id] PATCH error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/fotw/admin/seasons/:id
// Removes the season metadata document only. FOTWFilm is never touched.
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const [session] = await Promise.all([getServerSession(authOptions), dbConnect()]);
    if (!session?.user?.email || !FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Season id is required' }, { status: 400 });
    }

    const deleted = await FOTWSeason.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Season not found' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    console.error('[admin/seasons/:id] DELETE error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
