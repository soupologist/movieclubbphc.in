import dotenv from "dotenv";
dotenv.config();

import dbConnect from "@/lib/dbConnect";
import Film from "@/models/Film";

async function editFilm() {
  await dbConnect();

  const updatedFilm = await Film.findOneAndUpdate(
    { id: "our-narrow-slice" }, // Find the film by its unique ID
    {
      // 👇 Fields you want to update
      credits: [
        { title: 'Cinematography', names: ['Advik Kulkarni']}
      ],
    },
    {
      new: true, // Return the updated document
    }
  );

  if (!updatedFilm) {
    console.log("Film not found.");
  } else {
    console.log("Film updated:", updatedFilm);
  }

  process.exit();
}

editFilm();
