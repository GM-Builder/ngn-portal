'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/types';
import { PlusCircle, Edit2, Trash2, FolderOpen, AlertCircle } from 'lucide-react';
import { slugify } from '@/lib/utils';

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*, articles(count)')
        .order('name', { ascending: true });

      if (error) throw error;

      setCategories(
        (data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          created_at: cat.created_at,
          articleCount: cat.articles?.[0]?.count || 0,
        }))
      );
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle auto-slug on name change
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  const handleEditClick = (cat: Category) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      if (isEditing && editingId) {
        const { error } = await supabase
          .from('categories')
          .update({ name, slug, description })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ name, slug, description }]);
        if (error) throw error;
      }

      handleCancelEdit();
      await fetchCategories();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    if (category.articleCount && category.articleCount > 0) {
      setError(`Kategori "${category.name}" tidak dapat dihapus karena masih memiliki ${category.articleCount} artikel.`);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await fetchCategories();
    } catch (err: any) {
      console.error(err);
      setError('Gagal menghapus kategori.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl uppercase tracking-tight text-primary">
          Kelola Kategori
        </h1>
        <p className="text-xs text-muted-foreground font-semibold mt-1">
          Tambah, edit, dan hapus kategori pengelompokan berita NGN Portal.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold p-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Grid: Form Left, List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container (Col 5) */}
        <div className="lg:col-span-5 bg-card border border-border p-6 space-y-4">
          <h2 className="font-heading font-extrabold text-base uppercase text-primary tracking-tight border-b border-border pb-3">
            {isEditing ? 'Edit Kategori' : 'Kategori Baru'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nama Kategori
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="misal: Gaya Hidup"
                className="w-full px-3 py-2 bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Slug (URL Friendly)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="misal: gaya-hidup"
                className="w-full px-3 py-2 bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat mengenai kategori berita ini..."
                rows={3}
                className="w-full px-3 py-2 bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                disabled={submitting}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </button>
              
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 border border-border hover:bg-secondary text-foreground font-heading font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Container (Col 7) */}
        <div className="lg:col-span-7 bg-card border border-border p-6 space-y-4">
          <h2 className="font-heading font-extrabold text-base uppercase text-primary tracking-tight border-b border-border pb-3">
            Daftar Kategori
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Memuat kategori...</p>
          ) : categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30">
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Artikel</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {cat.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{cat.slug}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-secondary text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {cat.articleCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(cat)}
                          className="p-1.5 hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
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
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">Belum ada kategori terdaftar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
