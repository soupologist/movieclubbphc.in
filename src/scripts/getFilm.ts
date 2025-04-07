import dotenv from "dotenv";
dotenv.config();

import dbConnect from "@/lib/dbConnect";
import Film from "@/models/Film";

async function getFilm() {
  await dbConnect();

  const film = await Film.findOne({ id: "1-lakh-saal" }).lean();

  if (!film) {
    console.log("Film not found.");
    process.exit();
  }

  // Pretty-print the result in JSON format
  console.log(JSON.stringify(film, null, 2)); // <- easy to read & copy/edit

  process.exit();
}

getFilm();
