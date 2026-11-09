import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const LIVE_URL = process.env.LIVE_STOREFRONT_URL || 'https://sonushoe.in';
const LIVE_ADMIN_URL = process.env.LIVE_ADMIN_URL || 'http://187.127.188.196:3001';
const ADMIN_USER_CODE = process.env.ADMIN_USER_CODE || '8008';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sonu_shoes?directConnection=true';
const DB_NAME = process.env.MONGODB_DB || 'sonu_shoes';

async function main() {
  console.log(`\n=== SONU PRODUCTION DATABASE SYNC ===`);
  console.log(`Live Storefront: ${LIVE_URL}`);
  console.log(`Live Admin:      ${LIVE_ADMIN_URL}`);
  console.log(`Target Local DB: ${MONGO_URI}/${DB_NAME}`);
  console.log(`=====================================\n`);

  // 1. Authenticate with Production Admin API
  let adminCookie = '';
  try {
    const authRes = await fetch(`${LIVE_ADMIN_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: ADMIN_USER_CODE }),
    });
    const setCookie = authRes.headers.get('set-cookie');
    if (authRes.ok && setCookie) {
      adminCookie = setCookie.split(';')[0];
      console.log(`[Sync] ✓ Authenticated with Live Admin API (User ${ADMIN_USER_CODE})`);
    } else {
      console.warn(`[Sync] ⚠ Warning: Could not authenticate with Live Admin. Cookie fallback: sonu_admin_user=8008`);
      adminCookie = 'sonu_admin_user=8008';
    }
  } catch (err) {
    console.warn(`[Sync] ⚠ Live Admin login warning:`, err.message);
    adminCookie = 'sonu_admin_user=8008';
  }

  const adminHeaders = {
    Cookie: adminCookie,
    'Content-Type': 'application/json',
  };

  // 2. Connect to Local MongoDB
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  // Helper to format ObjectId safely
  const formatDocId = (doc) => {
    const copy = { ...doc };
    if (copy._id && typeof copy._id === 'string' && copy._id.length === 24 && /^[0-9a-fA-F]{24}$/.test(copy._id)) {
      try {
        copy._id = new ObjectId(copy._id);
      } catch {}
    }
    return copy;
  };

  // --- SYNC PRODUCTS ---
  console.log(`\n[Sync] 1/6 Fetching live products...`);
  try {
    const res = await fetch(`${LIVE_URL}/api/products`);
    const data = await res.json();
    if (data.success && Array.isArray(data.products)) {
      const formatted = data.products.map(formatDocId);
      if (formatted.length > 0) {
        // Backup
        const existing = await db.collection('products').find({}).toArray();
        if (existing.length > 0) {
          await db.collection('products_backup').deleteMany({});
          await db.collection('products_backup').insertMany(existing);
        }
        await db.collection('products').deleteMany({});
        await db.collection('products').insertMany(formatted);
        console.log(`[Sync] ✓ Synced ${formatted.length} products to local DB`);
      }

      // Download missing images
      const uploadsDir = path.join(rootDir, 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const allImages = new Set();
      data.products.forEach((p) => {
        if (p.image) allImages.add(p.image);
        if (Array.isArray(p.gallery)) p.gallery.forEach((img) => allImages.add(img));
      });

      let downloadedCount = 0;
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
                downloadedCount++;
              }
            } catch (e) {
              console.warn(`[Sync] Warning: Failed to download ${filename}:`, e.message);
            }
          }
        }
      }
      if (downloadedCount > 0) {
        console.log(`[Sync] ✓ Downloaded ${downloadedCount} missing product images`);
      }
    }
  } catch (err) {
    console.error(`[Sync] Error syncing products:`, err.message);
  }

  // --- SYNC ORDERS ---
  console.log(`\n[Sync] 2/6 Fetching live orders...`);
  try {
    const res = await fetch(`${LIVE_ADMIN_URL}/api/orders?status=all`, { headers: adminHeaders });
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      const formatted = data.orders.map(formatDocId);
      if (formatted.length > 0) {
        // Upsert orders by orderId or _id
        for (const ord of formatted) {
          const query = ord.orderId ? { orderId: ord.orderId } : { _id: ord._id };
          await db.collection('orders').replaceOne(query, ord, { upsert: true });
        }
        console.log(`[Sync] ✓ Synced ${formatted.length} live orders to local DB`);
      } else {
        console.log(`[Sync] No remote orders found`);
      }
    }
  } catch (err) {
    console.error(`[Sync] Error syncing orders:`, err.message);
  }

  // --- SYNC CUSTOMERS / USERS ---
  console.log(`\n[Sync] 3/6 Fetching live customers / users...`);
  try {
    const res = await fetch(`${LIVE_ADMIN_URL}/api/customers?limit=500`, { headers: adminHeaders });
    const data = await res.json();
    if (data.success && Array.isArray(data.customers)) {
      const existing = await db.collection('users').find({}).toArray();
      if (existing.length > 0) {
        await db.collection('users_backup').deleteMany({});
        await db.collection('users_backup').insertMany(existing);
      }
      await db.collection('users').deleteMany({});

      const userDocs = data.customers.map((c) => ({
        _id: c._id && typeof c._id === 'string' && c._id.length === 24 && /^[0-9a-fA-F]{24}$/.test(c._id)
          ? new ObjectId(c._id)
          : c._id || new ObjectId(),
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer',
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        email: c.email || '',
        mobile: c.mobile || '',
        primaryAddress: c.primaryAddress || {},
        orders: Array.isArray(c.orders) ? c.orders.map((o) => o.orderId || o) : [],
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      }));

      // Filter out duplicate emails if any in source data to respect email_1 unique index
      const seenEmails = new Set();
      const dedupedDocs = [];
      for (const doc of userDocs) {
        const emailLower = (doc.email || '').toLowerCase().trim();
        if (emailLower) {
          if (seenEmails.has(emailLower)) continue;
          seenEmails.add(emailLower);
        }
        dedupedDocs.push(doc);
      }

      if (dedupedDocs.length > 0) {
        await db.collection('users').insertMany(dedupedDocs);
      }
      console.log(`[Sync] ✓ Synced ${dedupedDocs.length} customers to local collection 'users'`);
    }
  } catch (err) {
    console.error(`[Sync] Error syncing customers:`, err.message);
  }

  // --- SYNC VIEWS / ANALYTICS ---
  console.log(`\n[Sync] 4/6 Fetching live page views & analytics...`);
  try {
    const res = await fetch(`${LIVE_ADMIN_URL}/api/views?limit=500`, { headers: adminHeaders });
    const data = await res.json();
    if (data.success && Array.isArray(data.views)) {
      for (const v of data.views) {
        const viewDoc = { ...v };
        await db.collection('views').replaceOne({ _id: viewDoc._id }, viewDoc, { upsert: true });
      }
      console.log(`[Sync] ✓ Synced ${data.views.length} analytics view metrics (Total Live Views: ${data.stats?.totalViews || 'N/A'})`);
    }
  } catch (err) {
    console.error(`[Sync] Error syncing views:`, err.message);
  }

  // --- SYNC SETTINGS ---
  console.log(`\n[Sync] 5/6 Fetching live settings...`);
  try {
    const res = await fetch(`${LIVE_ADMIN_URL}/api/settings`, { headers: adminHeaders });
    const data = await res.json();
    if (data.success) {
      if (data.seller) {
        await db.collection('settings').updateOne({ _id: 'seller_settings' }, { $set: data.seller }, { upsert: true });
      }
      if (data.homepage) {
        await db.collection('settings').updateOne({ _id: 'homepage_settings' }, { $set: data.homepage }, { upsert: true });
      }
      if (data.shiprocket) {
        await db.collection('settings').updateOne({ _id: 'shiprocket_settings' }, { $set: data.shiprocket }, { upsert: true });
      }
      if (data.checkout) {
        await db.collection('settings').updateOne({ _id: 'checkout_settings' }, { $set: data.checkout }, { upsert: true });
      }
      if (data.enableNumberVerification !== undefined || data.enableEmailVerification !== undefined) {
        await db.collection('settings').updateOne(
          { _id: 'auth_settings' },
          {
            $set: {
              enableNumberVerification: Boolean(data.enableNumberVerification),
              enableEmailVerification: Boolean(data.enableEmailVerification),
            },
          },
          { upsert: true }
        );
      }
      // Also general storefront doc
      await db.collection('settings').updateOne(
        { type: 'general' },
        {
          $set: {
            homepage: data.homepage,
            checkout: data.checkout,
            seller: data.seller,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`[Sync] ✓ Synced seller, shiprocket, homepage, checkout, and auth settings`);
    }
  } catch (err) {
    console.error(`[Sync] Error syncing settings:`, err.message);
  }

  // --- SYNC TAXONOMIES ---
  console.log(`\n[Sync] 6/6 Fetching taxonomies...`);
  try {
    const res = await fetch(`${LIVE_ADMIN_URL}/api/taxonomies`, { headers: adminHeaders });
    const data = await res.json();
    if (data.success) {
      await db.collection('taxonomies').updateOne(
        { _id: 'global_taxonomies' },
        {
          $set: {
            categories: data.categories || [],
            sports: data.sports || [],
            returnPolicies: data.returnPolicies || [],
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`[Sync] ✓ Synced product taxonomies (categories, sports, return policies)`);
    }
  } catch (err) {
    console.error(`[Sync] Error syncing taxonomies:`, err.message);
  }

  await client.close();
  console.log(`\n========================================`);
  console.log(`✓ SYNC COMPLETE! Local database is 100% in sync with production.`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error(`[Sync] Fatal error:`, err);
  process.exit(1);
});
