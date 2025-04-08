import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

// Correct usage of global typing
declare global {
  // Fix both errors here by using `let` not `var` and removing the eslint-disable
  // `globalThis` is modern and valid for both Node and browser if needed
  // You can also use `globalThis` in place of `global`
  // Just make sure it’s consistent
  // eslint-disable-next-line no-var -- ✘ REMOVE THIS LINE, it's not needed
  let _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
