import { MongoClient } from "mongodb";

const globalForMongo = globalThis;

export async function invitationsCollection() {
  return collection("invitations");
}

export async function invitationRecipientsCollection() {
  return collection("invitation_recipients");
}

export async function guestWishesCollection() {
  const wishes = await collection("guest_wishes");
  if (!globalForMongo.guestWishIndexesPromise) {
    globalForMongo.guestWishIndexesPromise = Promise.all([
      wishes.createIndex({ status: 1, approvedAt: -1, createdAt: -1 }),
      wishes.createIndex({ recipientId: 1, status: 1, createdAt: -1 }),
    ]);
  }
  try {
    await globalForMongo.guestWishIndexesPromise;
  } catch (error) {
    globalForMongo.guestWishIndexesPromise = null;
    throw error;
  }
  return wishes;
}

export async function wishRateLimitsCollection() {
  const rateLimits = await collection("wish_rate_limits");
  if (!globalForMongo.wishRateLimitIndexPromise) {
    globalForMongo.wishRateLimitIndexPromise = rateLimits.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
  }
  try {
    await globalForMongo.wishRateLimitIndexPromise;
  } catch (error) {
    globalForMongo.wishRateLimitIndexPromise = null;
    throw error;
  }
  return rateLimits;
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
