import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import Film from '../models/Film.js';

const films = [
  {
    id: 'our-narrow-slice',
    title: "Our Narrow Slice",
    generalCredits: ["Pranay Vajrapu", "Sai Ashish Vure", "Advik Kulkarni"],
    credits: [
      { title: "Director", names: ["Pranay Vajrapu"] },
      { title: "Cinematographer", names: ["Sai Ashish Vure"] },
      { title: "Editor", names: ["Advik Kulkarni"] },
    ],
    date: "November 12, 2024",
    poster: "/images/full-poster.jpg",
    description: [
      "A space enthusiast desires to capture a rare astronomical phenomenon, a comet seen only once in every 83 years.",
    ],
    background: "/videos/test.mp4",
    embed: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    awards: [
      { title: "1st Place", details: "Drishya '25 - Chalchitra Film Festival - IIT Guwahati" },
      { title: "2nd Place", details: "SHO(R)T - BITS Goa" }
    ],
    notes: [
      "The path followed by the main character was rehearsed for days before the final shoot."
    ],
    btsPhotos: [
      "/images/bts1.jpg",
      "/images/bts2.jpg",
      "/images/bts3.jpg"
    ],
  },
];

async function seed() {
  await dbConnect();
  await Film.deleteMany({});
  await Film.insertMany(films);
  console.log("Seeded successfully");
  mongoose.connection.close();
}

seed();
