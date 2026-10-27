import React from 'react';
import OrdersHubClient from '@/components/orders/OrdersHubClient';

export const metadata = {
  title: 'Track Orders & Deliveries | Sonu shoe',
  description:
    'Track live courier delivery status for your Sonu shoe handcrafted luxury running shoes and sneakers. Enter your Order ID or phone number to view real-time tracking.',
  keywords: [
    'track Sonu shoe order',
    'shoes order tracking',
    'Sonu shoe delivery status',
    'footwear shipment tracking',
    'courier tracking India',
  ],
  alternates: {
    canonical: 'https://sonushoe.in/orders',
  },
  openGraph: {
    title: 'Track Orders & Deliveries | Sonu Shoe',
    description: 'Track live courier delivery status for your Sonu Shoe orders.',
    url: 'https://sonushoe.in/orders',
    siteName: 'Sonu Shoe',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Track Orders & Deliveries | Sonu Shoe',
    description: 'Track live courier delivery status for your Sonu Shoe orders.',
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
    name: 'Orders & Tracking | Sonu shoe',
    url: 'https://sonushoe.in/orders',
    description: 'Track orders, delivery status, and review order payment breakdowns.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Sonu shoe',
      url: 'https://sonushoe.in',
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
