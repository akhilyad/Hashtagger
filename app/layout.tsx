import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'HASHTAGGER — Real-Time AI Social Media Hashtag Intelligence',
  description:
    'AI-driven social media hashtag generator and trend intelligence workspace that analyzes text captions and post imagery in real time to maximize reach and engagement.',
  openGraph: {
    title: 'HASHTAGGER — Real-Time AI Social Media Hashtag Intelligence',
    description:
      'AI-driven social media hashtag generator and trend intelligence workspace that analyzes text captions and post imagery in real time to maximize reach and engagement.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HASHTAGGER — Real-Time AI Social Media Hashtag Intelligence',
    description:
      'AI-driven social media hashtag generator and trend intelligence workspace that analyzes text captions and post imagery in real time to maximize reach and engagement.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#FAFAFA] text-slate-900 antialiased selection:bg-indigo-600 selection:text-white"
        style={{fontFamily: 'var(--font-sans), sans-serif'}}
      >
        {children}
      </body>
    </html>
  );
}
