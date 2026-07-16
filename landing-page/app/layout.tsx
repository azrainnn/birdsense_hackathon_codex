import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BirdSense — Listen closer',
  description:
    'BirdSense turns the living soundscape into clear, conservation-ready signals.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
