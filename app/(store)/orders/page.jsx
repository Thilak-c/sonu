import React from 'react';
import OrdersHubClient from '@/components/orders/OrdersHubClient';

export const metadata = {
  title: 'Track Orders & Deliveries | SONU Shoes',
  description:
    'Track live courier delivery status for your SONU handcrafted luxury running shoes and sneakers. Enter your Order ID or phone number to view real-time tracking.',
  keywords: [
    'track SONU order',
    'shoes order tracking',
    'SONU delivery status',
    'footwear shipment tracking',
    'courier tracking India',
  ],
  alternates: {
    canonical: 'https://sonu.shoes/orders',
  },
  openGraph: {
    title: 'Track Orders & Deliveries | SONU Shoes',
    description: 'Track live courier delivery status for your SONU footwear orders.',
    url: 'https://sonu.shoes/orders',
    siteName: 'SONU Shoes',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Track Orders & Deliveries | SONU Shoes',
    description: 'Track live courier delivery status for your SONU footwear orders.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function OrdersPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: 'Orders & Tracking | SONU Shoes',
    url: 'https://sonu.shoes/orders',
    description: 'Track orders, delivery status, and review order payment breakdowns.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'SONU Shoes',
      url: 'https://sonu.shoes',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OrdersHubClient />
    </>
  );
}
