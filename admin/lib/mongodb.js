import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sonu_shoes?directConnection=true';
const dbName = process.env.MONGODB_DB || 'sonu_shoes';

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoAdminClientPromise) {
    client = new MongoClient(uri);
    global._mongoAdminClientPromise = client.connect();
  }
  clientPromise = global._mongoAdminClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export async function initDb() {
  try {
    const db = await getDb();
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    return db;
  } catch (err) {
    console.error('[Admin MongoDB] Init error:', err);
    throw err;
  }
}
