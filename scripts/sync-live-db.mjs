import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const LIVE_URL = 'https://sonushoe.in';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sonu_shoes?directConnection=true';
const DB_NAME = process.env.MONGODB_DB || 'sonu_shoes';

async function main() {
  console.log(`[Sync] Fetching live products from ${LIVE_URL}/api/products ...`);
  const res = await fetch(`${LIVE_URL}/api/products`);
  const data = await res.json();

  if (!data.success || !Array.isArray(data.products)) {
    throw new Error('Failed to fetch live products');
  }

  console.log(`[Sync] Fetched ${data.products.length} live products.`);

  // Download missing images to uploads/
  const uploadsDir = path.join(rootDir, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const allImages = new Set();
  data.products.forEach((p) => {
    if (p.image) allImages.add(p.image);
    if (Array.isArray(p.gallery)) p.gallery.forEach((img) => allImages.add(img));
  });

  for (const imgPath of allImages) {
    if (imgPath.startsWith('/api/uploads/')) {
      const filename = imgPath.replace('/api/uploads/', '');
      const localFilePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(localFilePath)) {
        try {
          const imgRes = await fetch(`${LIVE_URL}${imgPath}`);
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            fs.writeFileSync(localFilePath, Buffer.from(buf));
            console.log(`[Sync] Downloaded image: ${filename}`);
          }
        } catch (e) {
          console.warn(`[Sync] Warning: Failed to download ${filename}:`, e.message);
        }
      }
    }
  }

  // Connect to local MongoDB
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  // Backup current products first
  const existing = await db.collection('products').find({}).toArray();
  if (existing.length > 0) {
    await db.collection('products_backup').deleteMany({});
    await db.collection('products_backup').insertMany(existing);
  }

  // Replace products
  await db.collection('products').deleteMany({});
  const formattedDocs = data.products.map((p) => {
    const doc = { ...p };
    if (doc._id) {
      try {
        doc._id = new ObjectId(doc._id);
      } catch (e) {}
    }
    return doc;
  });

  await db.collection('products').insertMany(formattedDocs);
  console.log(`[Sync] Updated local collection 'products' with ${formattedDocs.length} live products.`);

  // Sync settings
  try {
    const setRes = await fetch(`${LIVE_URL}/api/settings`);
    const setData = await setRes.json();
    if (setData.success) {
      delete setData.success;
      await db.collection('settings').updateOne(
        { type: 'general' },
        { $set: { ...setData, updatedAt: new Date() } },
        { upsert: true }
      );
      console.log(`[Sync] Synced live storefront settings.`);
    }
  } catch (err) {
    console.warn('[Sync] Settings sync error:', err.message);
  }

  await client.close();
  console.log('[Sync] Done! Local DB now matches production.');
}

main().catch((err) => {
  console.error('[Sync] Error:', err);
  process.exit(1);
});

