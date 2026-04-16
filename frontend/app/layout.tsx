import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'Complyt AI - Autonomous Document Compliance Platform',
  description: 'Secure document processing with AI-powered compliance validation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const useDark = stored ? stored === 'dark' : true;
    document.documentElement.classList.toggle('dark', useDark);
  } catch (_) {
    document.documentElement.classList.add('dark');
  }
})();`,
          }}
        />
      </head>
      <body className={`${manrope.variable} ${newsreader.variable} antialiased`}>{children}</body>
    </html>
  );
}
