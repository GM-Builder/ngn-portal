import type { Metadata } from 'next';
import { Space_Grotesk, Urbanist } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
});

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id'),
  title: 'NGN - Nice Good News',
  description: 'Portal Media Visual Modern Indonesia. Cepat, Informatif, Clean, dan Profesional.',
  icons: {
    icon: '/logos/NGN ICON .png',
  },
};

// ─── Konfigurasi Iklan ────────────────────────────────────────────────────────
// Isi nilai ini sesuai akun iklan kamu.
// Kosongkan string jika belum punya akun (placeholder akan tetap tampil).
//
// Google AdSense: isi ADSENSE_PUBLISHER_ID dengan "ca-pub-XXXXXXXXXXXXXXXX"
// Adsterra:       isi ADSTERRA_KEY dengan key dari dashboard Adsterra
// ─────────────────────────────────────────────────────────────────────────────
const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ?? '';
const AD_PROVIDER = process.env.NEXT_PUBLIC_AD_PROVIDER ?? ''; // 'adsense' | 'adsterra' | ''

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} ${urbanist.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-background text-foreground">
        {/* Anti-FOUC: runs before first paint to apply saved dark mode preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ngn-theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />

        {/* Google AdSense global script — hanya dimuat jika publisher ID sudah diisi */}
        {AD_PROVIDER === 'adsense' && ADSENSE_PUBLISHER_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        {children}
      </body>
    </html>
  );
}
