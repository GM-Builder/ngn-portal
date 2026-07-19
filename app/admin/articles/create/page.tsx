'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/types';
import TiptapEditor from '@/components/admin/TiptapEditor';
import { slugify, calculateReadingTime } from '@/lib/utils';
import { ArrowLeft, Save, AlertCircle, Upload, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CreateArticlePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [readingTime, setReadingTime] = useState(1);

  // Uploading states
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err: any) {
        console.error(err);
        setError('Gagal memuat kategori.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update slug and reading time dynamically
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  const handleContentChange = (richHtml: string) => {
    setContent(richHtml);
    // Rough estimation of reading time
    // Strip HTML tags for clean words count
    const cleanText = richHtml.replace(/<[^>]*>/g, ' ');
    setReadingTime(calculateReadingTime(cleanText));
  };

  // Main featured image upload — goes through /api/upload for auth + validation
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Upload gagal.');
      setImageUrl(json.url);
    } catch (err: any) {
      console.error(err);
      setError('Gagal mengunggah gambar. Silakan gunakan tautan eksternal atau coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!categoryId) {
      setError('Silakan pilih kategori artikel.');
      setSaving(false);
      return;
    }

    if (!content || content === '<p></p>') {
      setError('Konten artikel tidak boleh kosong.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const payload = {
        title,
        slug: slug || slugify(title) + '-' + Date.now(),
        category_id: Number(categoryId),
        author: author || 'Redaksi NGN',
        image_url: imageUrl || null,
        excerpt: excerpt || null,
        content,
        is_featured: isFeatured,
        is_breaking: isBreaking,
        reading_time_minutes: readingTime,
        published_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('articles').insert([payload]);

      if (error) throw error;

      router.push('/admin/articles');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menerbitkan artikel.');
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-12">Memuat halaman editor...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Top Header Actions */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Link
          href="/admin/articles"
          className="p-2 hover:bg-secondary text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading font-extrabold text-2xl uppercase tracking-tight text-primary">
            Tulis Artikel Baru
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Publikasikan tulisan berita terbaru Anda di portal NGN.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Title & Rich Text Editor (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-border p-6 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Judul Berita
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ketik judul berita yang menarik dan informatif..."
                className="w-full px-4 py-3 bg-secondary/30 border border-border font-heading font-extrabold text-lg md:text-xl text-foreground focus:outline-none focus:border-primary transition-colors"
                required
                disabled={saving}
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Slug URL (Ramah SEO)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-dari-judul"
                className="w-full px-3 py-2 bg-secondary/10 border border-border font-mono text-xs text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                required
                disabled={saving}
              />
            </div>
          </div>

          {/* Tiptap Rich Text Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Isi Artikel Berita
            </label>
            <TiptapEditor content={content} onChange={handleContentChange} />
          </div>
        </div>

        {/* Right Side: Sidebar Meta details (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="bg-card border border-border p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase text-primary border-b border-border pb-3">
              Informasi Publikasi
            </h3>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Kategori Berita
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                required
                disabled={saving}
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nama Penulis / Redaktur
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="misal: Andi Wijaya"
                className="w-full px-3 py-2 bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                required
                disabled={saving}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ringkasan Berita (Excerpt)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Tulis ringkasan berita 1-2 kalimat untuk preview halaman depan..."
                rows={3}
                className="w-full px-3 py-2 bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                disabled={saving}
              />
            </div>

            {/* Reading Time */}
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground pt-1">
              <span>WAKTU BACA ESTIMASI:</span>
              <span className="text-primary font-mono bg-secondary px-2 py-0.5">{readingTime} MENIT</span>
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="bg-card border border-border p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase text-primary border-b border-border pb-3">
              Foto Utama (Featured Image)
            </h3>

            {/* Image Preview */}
            {imageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden bg-secondary border border-border group">
                <Image
                  src={imageUrl}
                  alt="Featured preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute inset-0 bg-red-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold uppercase tracking-wider"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <div className="aspect-video w-full bg-secondary flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border p-4 text-center">
                <FileText className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-semibold">Belum ada foto utama.</p>
              </div>
            )}

            {/* File Upload Trigger */}
            <div className="space-y-2">
              <label className="flex items-center justify-center gap-2 border border-border hover:bg-secondary py-2 px-4 text-xs font-bold uppercase tracking-wider text-foreground cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-primary" />
                {uploading ? 'Mengunggah...' : 'Unggah File Foto'}
                <input
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={uploading || saving}
                />
              </label>
            </div>

            {/* Direct URL input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Atau masukkan Tautan Gambar Langsung
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 bg-secondary/30 border border-border font-mono text-xs focus:outline-none focus:border-primary transition-colors"
                disabled={saving}
              />
            </div>
          </div>

          {/* Visibility & Settings Card */}
          <div className="bg-card border border-border p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase text-primary border-b border-border pb-3">
              Tipe Publikasi
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-primary border-border focus:ring-primary mt-0.5"
                  disabled={saving}
                />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                    Headline Utama (Featured)
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 leading-relaxed font-semibold">
                    Tampilkan di banner utama halaman depan dengan ukuran besar.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="w-4 h-4 text-primary border-border focus:ring-primary mt-0.5"
                  disabled={saving}
                />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                    Berita Penting (Breaking News)
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 leading-relaxed font-semibold">
                    Kirim ke running ticker berjalan di halaman utama.
                  </span>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-xs uppercase tracking-widest py-3.5 w-full transition-colors disabled:opacity-50 cursor-pointer pt-3"
              disabled={saving || uploading}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menerbitkan...' : 'Terbitkan Artikel'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
