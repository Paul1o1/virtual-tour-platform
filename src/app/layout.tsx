import type { Metadata, Viewport } from 'next';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import '@photo-sphere-viewer/gallery-plugin/index.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Addis 360 Tour • Virtual Tour Platform',
  description: 'High-performance interactive 360-degree virtual tour platform with scene linking, custom hotspots, and seamless embedding.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-ink text-paper">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full font-body antialiased overflow-hidden selection:bg-saffron selection:text-ink">
        {children}
      </body>
    </html>
  );
}
