'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ArticleError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error details to console, never expose to UI
    console.error('[ArticleError]', error.message, error.digest ?? '');
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="font-heading font-extrabold text-2xl uppercase tracking-tight text-foreground">
          Artikel Tidak Dapat Dimuat
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Maaf, artikel ini mengalami gangguan sementara. Silakan coba lagi atau kembali ke
          beranda untuk membaca berita lainnya.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-border hover:bg-secondary text-foreground font-heading font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
