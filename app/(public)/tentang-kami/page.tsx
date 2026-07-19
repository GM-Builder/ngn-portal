import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MapPin, Phone, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tentang Kami | NGN',
  description:
    'Kenali NGN — portal media visual modern Indonesia yang menghadirkan berita cepat, informatif, dan terpercaya.',
};

export default function TentangKamiPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      {/* Page Header */}
      <div className="border-b-4 border-accent pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">
          Profil Portal
        </span>
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl uppercase tracking-tight text-primary">
          Tentang NGN
        </h1>
      </div>

      {/* About Section */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-tight text-foreground border-l-4 border-primary pl-4">
          Siapa Kami
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">NGN (Nice Good News)</strong> adalah portal media
          visual modern Indonesia yang hadir untuk menyajikan berita terkini secara cepat,
          informatif, dan profesional. Kami berkomitmen untuk menjadi sumber informasi terpercaya
          bagi masyarakat Indonesia di era digital.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Dibangun di atas teknologi terkini, NGN menghadirkan pengalaman membaca berita yang
          bersih, nyaman, dan mudah diakses dari berbagai perangkat — baik desktop maupun mobile.
        </p>
      </section>

      {/* Mission Section */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-tight text-foreground border-l-4 border-primary pl-4">
          Misi Kami
        </h2>
        <ul className="space-y-3">
          {[
            'Menyajikan berita yang akurat, berimbang, dan dapat diverifikasi.',
            'Mengutamakan kecepatan tanpa mengorbankan kedalaman dan keakuratan informasi.',
            'Membangun ekosistem media digital yang sehat dan bertanggung jawab.',
            'Memberikan ruang bagi jurnalisme berkualitas yang melayani kepentingan publik.',
            'Mendorong literasi media di kalangan pembaca Indonesia.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-muted-foreground">
              <span className="mt-1 w-2 h-2 rounded-full bg-accent shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Contact Section */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-tight text-foreground border-l-4 border-primary pl-4">
          Kontak Redaksi
        </h2>
        <div className="bg-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Globe className="w-4 h-4 text-accent shrink-0" />
            <span>
              Website:{' '}
              <Link href="/" className="text-primary hover:underline font-semibold">
                ngn.id
              </Link>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="w-4 h-4 text-accent shrink-0" />
            <span>
              Email Redaksi:{' '}
              <a
                href="mailto:redaksi@ngn.id"
                className="text-primary hover:underline font-semibold"
              >
                redaksi@ngn.id
              </a>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 text-accent shrink-0" />
            <span>Telepon: +62 21 0000 0000</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>Jakarta, Indonesia</span>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="pt-4 border-t border-border flex gap-4 text-xs font-semibold text-muted-foreground">
        <Link href="/pedoman-media-siber" className="hover:text-primary transition-colors">
          Pedoman Media Siber
        </Link>
        <Link href="/" className="hover:text-primary transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
