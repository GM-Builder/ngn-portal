import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pedoman Media Siber | NGN',
  description:
    'Pedoman dan standar jurnalistik NGN dalam menyajikan berita yang akurat, berimbang, dan bertanggung jawab.',
};

export default function PedomanMediaSiberPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      {/* Page Header */}
      <div className="border-b-4 border-accent pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent mb-2 block">
          Standar Editorial
        </span>
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl uppercase tracking-tight text-primary">
          Pedoman Media Siber
        </h1>
        <p className="text-muted-foreground text-sm mt-3">
          NGN beroperasi sesuai dengan Pedoman Pemberitaan Media Siber yang ditetapkan oleh Dewan
          Pers Indonesia dan kode etik jurnalistik yang berlaku.
        </p>
      </div>

      {/* Prinsip Jurnalistik */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-tight text-foreground border-l-4 border-primary pl-4">
          Prinsip Jurnalistik
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          NGN menjunjung tinggi prinsip-prinsip jurnalistik yang bertanggung jawab dalam setiap
          pemberitaan:
        </p>
        <ul className="space-y-3">
          {[
            {
              title: 'Akurasi',
              desc: 'Setiap berita yang diterbitkan telah melalui proses verifikasi fakta dari minimal dua sumber yang dapat dipercaya.',
            },
            {
              title: 'Keberimbangan',
              desc: 'Kami memberikan ruang yang adil bagi semua pihak yang terlibat dalam suatu peristiwa untuk menyampaikan pandangannya.',
            },
            {
              title: 'Independensi',
              desc: 'Redaksi NGN bebas dari pengaruh kepentingan politik, bisnis, atau kelompok tertentu dalam menentukan agenda pemberitaan.',
            },
            {
              title: 'Transparansi',
              desc: 'Kami terbuka tentang sumber informasi, metode pelaporan, dan kepentingan yang mungkin mempengaruhi pemberitaan.',
            },
            {
              title: 'Minimalisasi Kerugian',
              desc: 'Kami mempertimbangkan dampak pemberitaan terhadap individu dan komunitas, terutama kelompok rentan.',
            },
          ].map(({ title, desc }) => (
            <li key={title} className="bg-card border border-border p-4 space-y-1">
              <span className="font-bold text-sm text-foreground">{title}</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Kebijakan Koreksi */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-tight text-foreground border-l-4 border-primary pl-4">
          Kebijakan Koreksi
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          NGN berkomitmen untuk segera memperbaiki kesalahan yang ditemukan dalam pemberitaan:
        </p>
        <ul className="space-y-3">
          {[
            'Koreksi atas kesalahan faktual akan diterbitkan sesegera mungkin setelah kesalahan teridentifikasi dan diverifikasi.',
            'Koreksi akan ditempatkan secara jelas di dalam artikel yang bersangkutan, bukan disembunyikan.',
            'Untuk kesalahan yang signifikan, kami akan menerbitkan klarifikasi terpisah.',
            'Pembaca dapat melaporkan kesalahan melalui email redaksi@ngn.id.',
            'Kami tidak menghapus artikel yang sudah diterbitkan kecuali ada alasan hukum atau etika yang kuat.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Standar Verifikasi */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-tight text-foreground border-l-4 border-primary pl-4">
          Standar Verifikasi Berita
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Sebelum menerbitkan berita, tim redaksi NGN menerapkan standar verifikasi berikut:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              step: '01',
              title: 'Verifikasi Sumber',
              desc: 'Mengonfirmasi identitas dan kredibilitas sumber informasi.',
            },
            {
              step: '02',
              title: 'Pengecekan Silang',
              desc: 'Membandingkan informasi dari minimal dua sumber independen.',
            },
            {
              step: '03',
              title: 'Konfirmasi Pihak Terkait',
              desc: 'Memberikan kesempatan kepada pihak yang disebut untuk merespons.',
            },
            {
              step: '04',
              title: 'Review Editorial',
              desc: 'Setiap artikel melewati proses review oleh editor sebelum diterbitkan.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-card border border-border p-4 flex gap-4">
              <span className="font-heading font-extrabold text-2xl text-muted-foreground/20 shrink-0">
                {step}
              </span>
              <div>
                <p className="font-bold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Konten yang Dilarang */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-tight text-foreground border-l-4 border-destructive pl-4">
          Konten yang Tidak Kami Terbitkan
        </h2>
        <ul className="space-y-2">
          {[
            'Berita bohong (hoaks) atau informasi yang tidak dapat diverifikasi',
            'Konten yang menghasut kebencian berdasarkan SARA',
            'Materi yang melanggar privasi individu tanpa kepentingan publik yang jelas',
            'Konten pornografi atau kekerasan grafis',
            'Iklan yang disamarkan sebagai berita tanpa label yang jelas',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Footer Links */}
      <div className="pt-4 border-t border-border flex gap-4 text-xs font-semibold text-muted-foreground">
        <Link href="/tentang-kami" className="hover:text-primary transition-colors">
          Tentang Kami
        </Link>
        <Link href="/" className="hover:text-primary transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
