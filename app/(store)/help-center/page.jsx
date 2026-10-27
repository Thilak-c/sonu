import React from 'react';
import HelpCenterClient from '@/components/help/HelpCenterClient';

export const metadata = {
  title: 'Help Center & Customer Support | Sonu Shoe',
  description:
    'Need help with your Sonu Shoe handcrafted order? Browse topics including order tracking, shipping, returns, refunds, warranty, and connect with customer support.',
  keywords: [
    'Sonu Shoe help center',
    'customer support',
    'shoe returns',
    'shoe warranty',
    'order tracking',
    'customer service',
    'handcrafted sneakers support',
  ],
  alternates: {
    canonical: '/help-center',
  },
  openGraph: {
    title: 'Help Center & Customer Support | Sonu Shoe',
    description:
      'Browse topics including order tracking, shipping, returns, refunds, warranty, and connect with customer support.',
    url: '/help-center',
    siteName: 'Sonu Shoe',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center & Customer Support | Sonu Shoe',
    description:
      'Browse topics including order tracking, shipping, returns, refunds, warranty, and connect with customer support.',
  },
};

export default function HelpCenterPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I track my Sonu Shoe order?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can track live courier dispatch and expected delivery directly at /order/[id] with real-time Shiprocket AWB status.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the return and exchange policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer an easy 7-day hassle-free return and doorstep size exchange policy across India for all unused pairs.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does delivery take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Orders are dispatched within 24 hours. Standard surface transit takes 2-4 business days for metro cities.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I contact customer support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Reach out on WhatsApp at +91 8008439762 or email Support@sonushoe.in.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HelpCenterClient />
    </>
  );
}
