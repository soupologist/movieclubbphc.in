import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Film from "@/models/Film";

// Define the Film type if you have a TypeScript interface/model
// If you're using Mongoose with TypeScript, you can import the type from your Film model
// Example: import { FilmType } from "@/models/Film";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const films = await Film.find({});
      res.status(200).json(films);
    } catch (error) {
      console.error("Error fetching films:", error);
      res.status(500).json({ error: "Failed to fetch films" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
