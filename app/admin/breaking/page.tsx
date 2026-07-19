'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BreakingNews } from '@/types';
import { PlusCircle, Trash2, Radio, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

// Minimal type for the article link dropdown
type ArticleOption = { id: number; title: string };

export default function BreakingNewsAdminPage() {
  const [breakingItems, setBreakingItems] = useState<BreakingNews[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [text, setText] = useState('');
  const [articleId, setArticleId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: breakingData, error: breakingError } = await supabase
        .from('breaking_news')
        .select('*, articles(title, slug)')
        .order('created_at', { ascending: false });

      if (breakingError) throw breakingError;

      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('id, title')
        .order('published_at', { ascending: false });

      if (articlesError) throw articlesError;

      setBreakingItems(
        (breakingData || []).map((item: any) => ({
          id: item.id,
          text: item.text,
          is_active: item.is_active,
          article_id: item.article_id,
          created_at: item.created_at,
          article_title: item.articles?.title || undefined,
          article_slug: item.articles?.slug || undefined,
        }))
      );
      setArticles((articlesData || []).map((a: any) => ({ id: a.id, title: a.title })));
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data running ticker.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const payload = {
        text,
        article_id: articleId ? Number(articleId) : null,
        is_active: isActive,
      };

      const { error } = await supabase.from('breaking_news').insert([payload]);
      if (error) throw error;

      setText('');
      setArticleId('');
      setIsActive(true);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menambahkan breaking news.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('breaking_news')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setBreakingItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_active: !currentStatus } : item))
      );
    } catch (err: any) {
      console.error(err);
      setError('Gagal mengubah status aktif.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus breaking news ini?')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('breaking_news').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError('Gagal menghapus breaking news.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl uppercase tracking-tight text-primary">
          Kelola Running Ticker
        </h1>
        <p className="text-xs text-muted-foreground font-semibold mt-1">
          Atur teks berjalan (breaking news) yang ditampilkan di portal halaman utama.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container (Col 5) */}
        <div className="lg:col-span-5 bg-card border border-border p-6 space-y-4">
          <h2 className="font-heading font-extrabold text-base uppercase text-primary tracking-tight border-b border-border pb-3">
            Tambah Ticker Baru
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Teks Berita Berjalan
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="misal: BREAKING: Indonesia resmi terpilih menjadi tuan rumah konferensi internasional..."
                rows={4}
                className="w-full px-3 py-2 bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tautkan ke Artikel (Opsional)
              </label>
              <select
                value={articleId}
                onChange={(e) => setArticleId(e.target.value)}
                className="w-full px-3 py-2 bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                disabled={submitting}
              >
                <option value="">-- Tidak ditautkan ke artikel --</option>
                {articles.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary border-border focus:ring-primary"
                disabled={submitting}
              />
              <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                Aktifkan Langsung
              </label>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer pt-2"
              disabled={submitting}
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? 'Menambahkan...' : 'Tambah Ticker'}
            </button>
          </form>
        </div>

        {/* List Container (Col 7) */}
        <div className="lg:col-span-7 bg-card border border-border p-6 space-y-4">
          <h2 className="font-heading font-extrabold text-base uppercase text-primary tracking-tight border-b border-border pb-3">
            Running Ticker Terdaftar
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Memuat running ticker...</p>
          ) : breakingItems.length > 0 ? (
            <div className="space-y-4">
              {breakingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-border bg-secondary/5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      {item.text}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        Status:
                        <button
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className="flex items-center gap-1 cursor-pointer font-bold"
                        >
                          {item.is_active ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Nonaktif
                            </span>
                          )}
                        </button>
                      </span>

                      {item.article_title && (
                        <span className="text-accent truncate max-w-[200px] md:max-w-xs">
                          Tautan: {item.article_title}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer shrink-0"
                    title="Hapus"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">Belum ada running ticker terdaftar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
