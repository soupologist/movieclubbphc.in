import mongoose from "mongoose";

let isConnected = false;

export default async function dbConnect(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error; // Rethrow so you can catch it upstream if needed
  }
}
