import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MNEMOS – Cognitive Preservation System',
  description: 'Bir insanın düşünme biçimini, hatırlama örüntülerini ve karar alma karakterini zaman içinde bozulmadan muhafaza etmek için tasarlanmış kişisel bir bilişsel koruma sistemi.',
  keywords: ['cognitive preservation', 'memory', 'identity', 'MNEMOS', 'bilişsel koruma'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
