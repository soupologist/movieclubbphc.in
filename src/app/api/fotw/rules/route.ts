import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import { authOptions } from '@/lib/auth';
import { FOTW_ADMINS } from '@/lib/fotwConfig';
import { FOTWRules } from '@/lib/fotw/schemas';

const DEFAULT_RULES_CONTENT = `## How Film of the Week Works

Each week, one member of the club gets to choose a film for everyone to watch. Here's how it all works:

---

## The Leaderboard

- Every time you watch and log the Film of the Week on this site, your score increases by 1.
- The leaderboard ranks all members by how many films they have watched.
- Only members who have watched at least one film appear on the leaderboard.

---

## Choosing the Next Film

- The member with the **highest score** at the end of the week earns the right to choose next week's film.
- If two or more members are tied at the top, a **wheel spin** decides who gets to choose.
- Once you have had your turn to choose, you are **not eligible to choose again** until everyone else has had a turn.
- Your score on the leaderboard continues to grow even after your turn — watching films always counts.

---

## Logging a Film

- To have your watch count, you must **log the film** on this website by clicking the Watched button.
- Logging is compulsory — simply watching the film without logging it does not count toward your score.
- You can also rate the film (0.5 to 5 stars) and like it after logging.

---

## Ratings

- Ratings are visible to everyone.
- You must log the film before you can rate it.
- You can update your rating at any time while the film is active.
- Once the week ends and the film is archived, ratings are locked.

---

## The Weekly Cycle

- Each film is active for **7 days** from when it is added by an admin.
- When the timer hits zero, the film is automatically archived and its data is locked.
- The chosen member communicates their pick to an admin over WhatsApp, and the admin adds it to the site.

---

## Archive

- All previous Films of the Week are visible in the archive section on the main page.
- You can see each film's poster, average rating, individual ratings, watch count, and who chose it.
`;

export async function GET() {
  try {
    await dbConnect();

    let rules = await FOTWRules.findOne({}).lean();
    if (!rules) {
      const created = await FOTWRules.create({ content: DEFAULT_RULES_CONTENT });
      rules = created.toObject();
    }

    return NextResponse.json({
      content: rules.content,
      updatedAt: rules.updatedAt,
      updatedBy: rules.updatedBy ?? null,
    });
  } catch (error) {
    console.error('Error fetching FOTW rules:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!FOTW_ADMINS.includes(session.user.email)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    await dbConnect();

    const updated = await FOTWRules.findOneAndUpdate(
      {},
      {
        content,
        updatedBy: session.user.email,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      content: updated?.content ?? content,
      updatedAt: updated?.updatedAt ?? new Date(),
      updatedBy: updated?.updatedBy ?? session.user.email,
    });
  } catch (error) {
    console.error('Error updating FOTW rules:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
