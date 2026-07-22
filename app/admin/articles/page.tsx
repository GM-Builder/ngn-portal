'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Article } from '@/types';
import {
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  FileText,
  Eye,
  Star,
  Zap,
} from 'lucide-react';

export default function ArticlesAdminListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

  // Fetch articles — supabase client created inside the callback, not at render level
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('articles')
        .select('*, categories(name)')
        .order('published_at', { ascending: false });

      if (error) throw error;

      setArticles(
        (data || []).map((art: any) => ({
          id: art.id,
          title: art.title,
          slug: art.slug,
          excerpt: art.excerpt,
          content: art.content,
          image_url: art.image_url,
          image_caption: art.image_caption || null,
          category_id: art.category_id,
          author: art.author,
          published_at: art.published_at,
          view_count: art.view_count,
          is_featured: art.is_featured,
          is_breaking: art.is_breaking,
          reading_time_minutes: art.reading_time_minutes,
          created_at: art.created_at,
          status: art.status || 'published',
          category_name: art.categories?.name || 'Uncategorized',
        }))
      );
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat artikel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublish = async (id: number) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    if (!confirm(`Publikasikan artikel "${article.title}"?`)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('articles')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setArticles((prev) => prev.map((art) => art.id === id ? { ...art, status: 'published' as const } : art));
    } catch (err: any) {
      console.error(err);
      setError('Gagal mempublikasikan artikel.');
    }
  };

  const handleDelete = async (id: number) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${article.title}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;

      // Filter out deleted article from state
      setArticles((prev) => prev.filter((art) => art.id !== id));
    } catch (err: any) {
      console.error(err);
      setError('Gagal menghapus artikel.');
    }
  };

  // Filter articles on client
  const filteredArticles = articles.filter(
    (art) =>
      (statusFilter === 'all' || art.status === statusFilter) &&
      (art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl uppercase tracking-tight text-primary">
            Kelola Artikel
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Buat, edit, publish, dan hapus artikel berita NGN Portal.
          </p>
        </div>

        <Link
          href="/admin/articles/create"
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Buat Artikel Baru
        </Link>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-card border border-border p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan judul, penulis, atau kategori..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        {/* Status Filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              statusFilter === 'draft'
                ? 'bg-yellow-500 text-white border-yellow-500'
                : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              statusFilter === 'published'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            Published
          </button>
        </div>
        <div className="text-xs text-muted-foreground font-semibold ml-auto">
          Menampilkan {filteredArticles.length} dari {articles.length} artikel
        </div>
      </div>

      {/* List Container */}
      <div className="bg-card border border-border p-6">
        {loading ? (
          /* Skeleton UI: 5 rows × 8 columns (Req. 14.1–14.4) */
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30">
                  <th className="py-3 px-4 w-16">Foto</th>
                  <th className="py-3 px-4">Judul</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Penulis</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.from({ length: 5 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="animate-pulse">
                    {/* Foto */}
                    <td className="py-3 px-4">
                      <div className="w-12 h-8 bg-secondary rounded" />
                    </td>
                    {/* Judul */}
                    <td className="py-3 px-4">
                      <div className="h-4 bg-secondary rounded w-48 max-w-full" />
                    </td>
                    {/* Kategori */}
                    <td className="py-3 px-4">
                      <div className="h-4 bg-secondary rounded w-20" />
                    </td>
                    {/* Penulis */}
                    <td className="py-3 px-4">
                      <div className="h-4 bg-secondary rounded w-24" />
                    </td>
                    {/* Views */}
                    <td className="py-3 px-4">
                      <div className="h-4 bg-secondary rounded w-12" />
                    </td>
                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="h-4 bg-secondary rounded w-16" />
                    </td>
                    {/* Tanggal */}
                    <td className="py-3 px-4">
                      <div className="h-4 bg-secondary rounded w-24" />
                    </td>
                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        <div className="w-7 h-7 bg-secondary rounded" />
                        <div className="w-7 h-7 bg-secondary rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30">
                  <th className="py-3 px-4 w-16">Foto</th>
                  <th className="py-3 px-4">Judul</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Penulis</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="py-3 px-4">
                      {art.image_url ? (
                        <div className="relative w-12 h-8 bg-secondary overflow-hidden border border-border">
                          <Image
                            src={art.image_url}
                            alt={art.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-8 bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground max-w-[200px] md:max-w-xs truncate">
                      <Link
                        href={`/article/${art.id}/${art.slug}`}
                        target="_blank"
                        className="hover:underline"
                        title={art.title}
                      >
                        {art.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-secondary text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        {art.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-muted-foreground">
                      {art.author}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {art.view_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 space-x-1 whitespace-nowrap">
                      {art.status === 'draft' ? (
                        <span className="inline-flex items-center gap-0.5 bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5" title="Draft">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5" title="Published">
                          Published
                        </span>
                      )}
                      {art.is_featured && (
                        <span className="inline-flex items-center gap-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5" title="Featured Headline">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Headline
                        </span>
                      )}
                      {art.is_breaking && (
                        <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5" title="Breaking News">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          Breaking
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(art.published_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {art.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(art.id)}
                          className="inline-block p-1.5 hover:bg-green-100 dark:hover:bg-green-950/30 text-green-600 transition-colors cursor-pointer"
                          title="Publish"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/admin/articles/edit/${art.id}`}
                        className="inline-block p-1.5 hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                        title="Edit Artikel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Tidak ada artikel ditemukan.</p>
            <Link
              href="/admin/articles/create"
              className="text-xs text-primary hover:underline font-bold mt-1 inline-block"
            >
              Tulis artikel pertama Anda sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
