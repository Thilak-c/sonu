import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sonu_shoes?directConnection=true';
const dbName = process.env.MONGODB_DB || 'sonu_shoes';

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Returns database instance
 */
export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

/**
 * Initializes indexes and seeds product catalog into MongoDB if empty
 */
export async function initDb() {
  try {
    const db = await getDb();

    // 1. Ensure indexes
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
    await db.collection('orders').createIndex({ 'customer.email': 1 });
    await db.collection('orders').createIndex({ 'customer.mobile': 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });

    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ mobile: 1 }, { sparse: true });

    await db.collection('products').createIndex({ slug: 1 }, { unique: true });

    return db;
  } catch (error) {
    console.error('[MongoDB] Initialization error:', error);
    throw error;
  }
}

export default clientPromise;
