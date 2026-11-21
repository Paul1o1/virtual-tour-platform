import type { Metadata, Viewport } from 'next';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import '@photo-sphere-viewer/gallery-plugin/index.css';
import './globals.css';

export const metadata: Metadata = {
  title: '360° Virtual Tour Platform',
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
    <html lang="en" className="h-full bg-zinc-950 text-zinc-100">
      <body className="h-full antialiased overflow-hidden selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
