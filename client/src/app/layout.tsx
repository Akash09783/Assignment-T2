import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Interactive 3D Electronic Circuit Designer & Simulator',
  description: 'Next.js, Three.js 3D Studio & 2D Schematic Simulator for ESP32, Sensors, OLED Displays & IoT Projects.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0b101b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="bg-slate-950 text-slate-100 antialiased overflow-hidden select-none h-full w-full">
        {children}
      </body>
    </html>
  );
}
