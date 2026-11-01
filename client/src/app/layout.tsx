import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Interactive 3D Electronic Circuit Designer & Simulator',
  description: 'Next.js, Three.js 3D Studio & 2D Schematic Simulator for ESP32, Sensors, OLED Displays & IoT Projects.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
