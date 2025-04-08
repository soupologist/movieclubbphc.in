/* eslint-disable no-var, @typescript-eslint/no-explicit-any */
import { MongoClient } from "mongodb";

export {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
