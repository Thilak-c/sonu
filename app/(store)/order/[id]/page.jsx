import React from 'react';
import { getDb, initDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import OrderTrackingClient from '@/components/order/OrderTrackingClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || '');

  return {
    title: `Track Order #${decodedId} | SONU Footwear`,
    description: `Track your handcrafted footwear delivery in real-time. Live Shiprocket courier status, expected delivery date, and order breakdown for SONU shoes.`,
    alternates: {
      canonical: `/order/${encodeURIComponent(decodedId)}`,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `Track Order #${decodedId} | SONU Footwear`,
      description: `Track your handcrafted footwear delivery in real-time. Live Shiprocket courier tracking and delivery address.`,
      url: `/order/${encodeURIComponent(decodedId)}`,
      siteName: 'SONU Footwear',
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Track Order #${decodedId} | SONU Footwear`,
      description: `Track your handcrafted footwear delivery in real-time. Live Shiprocket courier tracking and delivery address.`,
    },
  };
}

async function getOrder(orderId) {
  try {
    const db = await getDb();
    let order = await db.collection('orders').findOne({ orderId });

    if (!order && ObjectId.isValid(orderId)) {
      try {
        order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
      } catch (e) {
        // Not a valid ObjectId
      }
    }

    if (!order) return null;

    // Serialize MongoDB objects (ObjectId, Date) for Server Component -> Client Component boundary
    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error('Error fetching order on server:', error);
    return null;
  }
}

export default async function OrderTrackingPage({ params }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || '');
  const order = await getOrder(decodedId);

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Order',
    orderNumber: decodedId,
    orderStatus: order?.status ? `https://schema.org/Order${order.status}` : 'https://schema.org/OrderProcessing',
    broker: {
      '@type': 'Organization',
      name: 'SONU Footwear',
      url: 'https://sonushoes.com',
    },
    customer: {
      '@type': 'Person',
      name: order?.customer?.name || 'Customer',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OrderTrackingClient initialOrder={order} orderId={decodedId} />
    </>
  );
}
