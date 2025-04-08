import dotenv from "dotenv";
dotenv.config();

import dbConnect from '@/lib/dbConnect';
import Film from '@/models/Film';

async function addFilm() {
  await dbConnect();

  const newFilm = await Film.create({
    id: '1-lakh-saal',
    title: '1 Lakh Saal',
    generalCredits: ['Divyank Shrivastav', 'Archis Sahu'],
    credits: [
      { title: 'Starring', names: ['Anant Kumar']},
    ],
    date: 'November 8, 2024',
    poster: 'https://res.cloudinary.com/dlglodixp/image/upload/v1744046132/ek-lakh-saal_vq1rnb.jpg',
    description: 'A space enthusiast desires to capture a rare astronomical phenomenon, a comet seen only once in every 83 years.',
    background: '/videos/our-narrow-slice-shots.mp4',
    backgroundImage: '/images/vendetta.png',
    embed: 'https://www.instagram.com/p/Cya3UWjMD7q/',
    awards: [],
    notes: ['Fun fact 1', 'Fun fact 2'],
    btsPhotos: ['/images/new-bts1.jpg', '/images/new-bts2.jpg'],
    status: 'released',
  });

  console.log('Film added:', newFilm);
  process.exit();
}

addFilm();
