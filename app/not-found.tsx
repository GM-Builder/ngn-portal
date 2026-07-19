import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="border-l-4 border-accent pl-6 text-left max-w-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Error 404</p>
        <h1 className="font-heading font-extrabold text-4xl md:text-6xl text-primary tracking-tight">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-4 leading-relaxed font-semibold">
          Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau belum pernah ada.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
        <Link
          href="/"
          className="bg-primary text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-6 py-3 hover:bg-primary/90 transition-colors"
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/search"
          className="border border-border text-foreground font-heading font-bold text-xs uppercase tracking-wider px-6 py-3 hover:bg-secondary transition-colors"
        >
          Cari Berita
        </Link>
      </div>
    </div>
  );
}
