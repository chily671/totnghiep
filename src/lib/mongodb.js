import { MongoClient } from "mongodb";

const globalForMongo = globalThis;

export async function invitationsCollection() {
  return collection("invitations");
}

export async function invitationRecipientsCollection() {
  return collection("invitation_recipients");
}

async function collection(name) {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");

  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
    }).connect();
  }

  let client;
  try {
    client = await globalForMongo.mongoClientPromise;
  } catch (error) {
    globalForMongo.mongoClientPromise = null;
    throw error;
  }

  const database = process.env.MONGODB_DB
    ? client.db(process.env.MONGODB_DB)
    : client.db();
  return database.collection(name);
}
