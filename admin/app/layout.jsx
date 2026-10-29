import './globals.css';

export const metadata = {
  title: 'Sonu Shoe',
  description: 'Admin Panel',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
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
      <body
        suppressHydrationWarning
        className="min-h-screen text-[#111111] antialiased selection:bg-[#111111] selection:text-white"
        style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
