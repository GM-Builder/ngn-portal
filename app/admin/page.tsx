import Link from 'next/link';
import { getStatsSummary, getArticles } from '@/lib/queries/articles';
import {
  FileText,
  Eye,
  FolderOpen,
  TrendingUp,
  PlusCircle,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const revalidate = 0; // Dynamic dashboard page, do not cache

export default async function AdminDashboard() {
  const [stats, latestArticles] = await Promise.all([
    getStatsSummary(),
    getArticles({ limit: 5 }),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl uppercase tracking-tight text-primary">
            Dashboard Utama
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Pantau statistik konten dan kelola berita NGN Portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/articles/create"
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Artikel Baru
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Artikel */}
        <div className="bg-card border border-border p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Artikel
            </p>
            <h3 className="font-heading text-3xl font-extrabold text-foreground">
              {stats.totalArticles}
            </h3>
          </div>
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-card border border-border p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Pembaca
            </p>
            <h3 className="font-heading text-3xl font-extrabold text-foreground">
              {stats.totalViews.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-12 h-12 bg-accent/10 flex items-center justify-center text-accent">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Total Kategori */}
        <div className="bg-card border border-border p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Kategori
            </p>
            <h3 className="font-heading text-3xl font-extrabold text-foreground">
              {stats.totalCategories}
            </h3>
          </div>
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Artikel Hari Ini */}
        <div className="bg-card border border-border p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              24 Jam Terakhir
            </p>
            <h3 className="font-heading text-3xl font-extrabold text-foreground">
              {stats.todayArticles}
            </h3>
          </div>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Latest Articles Table (Col 2) */}
        <div className="xl:col-span-2 bg-card border border-border p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-heading font-extrabold text-base uppercase text-primary tracking-tight">
              Artikel Terbaru
            </h2>
            <Link
              href="/admin/articles"
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              Semua Artikel
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30">
                  <th className="py-3 px-4">Judul</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {latestArticles.length > 0 ? (
                  latestArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground max-w-[200px] md:max-w-xs truncate">
                        <Link
                          href={`/admin/articles`}
                          className="hover:underline"
                        >
                          {art.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-secondary text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          {art.category_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{art.view_count}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(art.published_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Belum ada artikel. Silakan buat artikel pertama Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tips or Info Panel (Col 1) */}
        <div className="space-y-6">
          <div className="bg-primary text-primary-foreground p-6 border border-primary">
            <h3 className="font-heading font-extrabold text-lg uppercase tracking-tight mb-3">
              Informasi Redaksi
            </h3>
            <ul className="space-y-3.5 text-xs text-primary-foreground/80 leading-relaxed font-semibold">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                Gunakan editor Tiptap dengan lengkap untuk menulis berita format Word.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                Pastikan gambar unggulan berkualitas tinggi sebelum menerbitkan berita.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                Breaking News secara otomatis akan muncul pada Running Ticker di halaman depan.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
