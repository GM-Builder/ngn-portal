'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { AlertCircle, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? 'Email atau password salah.' 
          : error.message);
        setLoading(false);
      } else {
        // Force state refresh and redirect
        router.refresh();
        router.push('/admin');
      }
    } catch (err: any) {
      console.error(err);
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border p-8 space-y-6 shadow-xl">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative h-14 w-40">
            <Image
              src="/logos/NGN.png"
              alt="NGN Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-heading font-extrabold text-xl uppercase tracking-tight text-primary">
            Admin Portal NGN
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Masuk untuk mengelola artikel, kategori, dan breaking news.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold p-3.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ngn.com"
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border focus:outline-none focus:border-primary text-sm transition-colors"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border focus:outline-none focus:border-primary text-sm transition-colors"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-heading font-bold text-xs uppercase tracking-widest py-3 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
