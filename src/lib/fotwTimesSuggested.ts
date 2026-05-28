import dbConnect from '@/lib/dbConnect';
import { FOTWFilm } from '@/lib/fotw/schemas';
import { FOTWUser } from '@/lib/fotw/schemas';

export async function syncTimesSuggestedFromFilms() {
  await dbConnect();

  const [films, users] = await Promise.all([
    FOTWFilm.find({
      $or: [
        { chosenByEmail: { $exists: true, $ne: '' } },
        { chosenBy: { $exists: true, $ne: '' } },
      ],
    })
      .select('chosenBy chosenByEmail')
      .lean(),
    FOTWUser.find({}).select('email name').lean(),
  ]);

  const byEmail = new Map<string, number>();
  const byName = new Map<string, number>();

  for (const film of films as any[]) {
    const chosenByEmail = (film.chosenByEmail || '').toString().trim().toLowerCase();
    const chosenBy = (film.chosenBy || '').toString().trim().toLowerCase();

    if (chosenByEmail) {
      byEmail.set(chosenByEmail, (byEmail.get(chosenByEmail) || 0) + 1);
    } else if (chosenBy) {
      byName.set(chosenBy, (byName.get(chosenBy) || 0) + 1);
    }
  }

  if (!users.length) return;

  await FOTWUser.bulkWrite(
    (users as any[]).map((u) => {
      const email = (u.email || '').toString().trim().toLowerCase();
      const name = (u.name || '').toString().trim().toLowerCase();
      const fromEmail = byEmail.get(email) || 0;
      const fromName = fromEmail === 0 ? byName.get(name) || 0 : 0;
      return {
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { timesSuggested: fromEmail + fromName } },
        },
      };
    })
  );
}
