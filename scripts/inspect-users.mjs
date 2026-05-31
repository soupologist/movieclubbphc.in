import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('fotwusers').find({}).toArray();
  console.log('Total users:', users.length);
  const withImage = users.filter(u => u.image);
  const withImageUrl = users.filter(u => u.imageUrl || u.imageurl);
  console.log('With image:', withImage.length);
  console.log('With imageUrl/imageurl:', withImageUrl.length);
  
  if (withImage.length > 0) console.log('Sample with image:', withImage[0].image);
  if (withImageUrl.length > 0) console.log('Sample with imageurl:', withImageUrl[0].imageUrl || withImageUrl[0].imageurl);
  
  process.exit(0);
}
run().catch(console.error);
