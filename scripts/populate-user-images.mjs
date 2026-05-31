import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const users = await db.collection('fotwusers').find({
    $or: [
      { image: { $exists: false } },
      { image: null },
      { image: "" }
    ]
  }).toArray();
  
  console.log(`Found ${users.length} users without an image.`);
  
  let updatedCount = 0;
  for (const user of users) {
    // Generate a dicebear avatar based on their name, username, or email
    const seed = user.name || user.username || user.email || 'User';
    const fallbackImage = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
    
    await db.collection('fotwusers').updateOne(
      { _id: user._id },
      { $set: { image: fallbackImage } }
    );
    updatedCount++;
  }
  
  console.log(`Successfully updated ${updatedCount} users with fallback images.`);
  process.exit(0);
}
run().catch(console.error);
