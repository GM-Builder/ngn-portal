import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/30 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="block mb-4">
              <div className="relative h-14 w-44">
                <Image
                  src="/logos/Logo.png"
                  alt="NGN Logo"
                  fill
                  className="object-contain"
                  sizes="176px"
                />
              </div>
            </Link>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Portal media visual modern Indonesia. Memberikan informasi yang cepat, tepercaya, berkembang, global, serta terkurasi secara profesional untuk masyarakat luas.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-primary tracking-wide uppercase text-sm mb-4">
              Navigasi
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground font-semibold">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-primary transition-colors">
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  Pencarian
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-primary tracking-wide uppercase text-sm mb-4">
              Redaksi & Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground font-semibold">
              <li>
                <Link href="/tentang-kami" className="hover:text-primary transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/pedoman-media-siber" className="hover:text-primary transition-colors">
                  Pedoman Media Siber
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/80 text-xs text-muted-foreground">
          <p>© {currentYear} NGN Media. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
