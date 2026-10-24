import '@/app/globals.css';

export const metadata = {
  metadataBase: new URL('https://sonushoe.in'),
  title: {
    default: 'Sonu shoe — Premium Footwear | For the Long Way Home',
    template: '%s | Sonu shoe',
  },
  description:
    'Sonu shoe crafts small-run, precision-engineered footwear designed for all-day comfort and timeless minimalism. Discover handcrafted sneakers built for the long way home.',
  keywords: [
    'Sonu shoe',
    'premium footwear',
    'small-run sneakers',
    'handcrafted shoes',
    'minimalist luxury sneakers',
    'ergonomic sole comfort',
    'everyday walking shoes',
    'designer footwear',
  ],
  authors: [{ name: 'Sonu shoe' }],
  creator: 'Sonu shoe',
  publisher: 'Sonu shoe',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Sonu shoe — Premium Footwear | For the Long Way Home',
    description:
      'Small-run, precision-engineered footwear built for timeless street style and ergonomic comfort.',
    url: 'https://sonushoe.in',
    siteName: 'Sonu shoe',
    images: [
      {
        url: '/Logo/Logo_Full.png',
        width: 1200,
        height: 630,
        alt: 'Sonu shoe Brand Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sonu shoe — Premium Footwear | For the Long Way Home',
    description:
      'Small-run, precision-engineered footwear built for timeless street style and ergonomic comfort.',
    images: ['/Logo/Logo_Full.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#9fd6c8" />
        <link
          rel="preload"
          href="/Logo/Logo_Full.png"
          as="image"
          type="image/png"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/Font/HelveticaNowText.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/Font/HelveticaNowTextMedium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
