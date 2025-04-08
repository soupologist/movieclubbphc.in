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
        title: "Our Narrow Slice",
        generalCredits: [
            "Pranay Vajrapu",
            "Advik Kulkarni",
            "Sai Ashish Vure"
        ],
        credits: [
            {
                title: "Director",
                names: [
                    "Pranay Vajrapu",
                    "Advik Kulkarni",
                    "Sai Ashish Vure",
                ],
            },
            {
                title: "Cinematographer",
                names: [
                    "Advik Kulkarni"
                ],
            },
            {
                title: "Editor",
                names: [
                    "Advik Kulkarni"
                ],
            },
            {
                title: "Original Score",
                names: [
                    "Sai Ashish Vure"
                ],
            },
            {
                title: "Starring",
                names: [
                    "Dhruv Kothari"
                ],
            },
            {
                title: "Voice-over by",
                names: [
                    "B. Venugopal Reddy"
                ],
            },
        ],
        awards: [
            {
                title: "1st Place",
                details: "Drishya '25 - Chalchitra Film Festival - IIT Guwahati",
            },
            {
                title: "2nd Place",
                details: "SHO(R)T - Waves '24 - BITS Goa",
            }
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
