'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Monetag Ad Scripts (Global - load once per page) ────────────────────────
const MONETAG_INPAGE_PUSH = `https://nap5k.com/tag.min.js`;
const MONETAG_VIGNETTE = `https://n6wxm.com/vignette.min.js`;
const MONETAG_DIRECT_LINK = `https://omg10.com/4/11353104`;

// ─── Monetag In-Page Push (Banner) ───────────────────────────────────────────
export function MonetagInPagePush() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.dataset.zone = '11353078';
    script.src = MONETAG_INPAGE_PUSH;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}

// ─── Monetag Vignette ────────────────────────────────────────────────────────
export function MonetagVignette() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.dataset.zone = '11353090';
    script.src = MONETAG_VIGNETTE;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}

// ─── Monetag Service Worker Registration ────────────────────────────────────
export function MonetagSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('[Monetag] SW registered'))
        .catch((err) => console.warn('[Monetag] SW registration failed:', err));
    }
  }, []);

  return null;
}

// ─── Monetag Direct Link Button ──────────────────────────────────────────────
export function MonetagDirectLink({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <a
      href={MONETAG_DIRECT_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-block', className)}
    >
      {children}
    </a>
  );
}

// ─── Adsterra Ad Codes ──────────────────────────────────────────────────────
const ADSTERRA_SCRIPTS: Record<string, string> = {
  leaderboard: `
    <script>
      atOptions = {
        'key' : 'dd722d075dc2918f94f2be8437eac9fb',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    </script>
    <script src="https://www.highperformanceformat.com/dd722d075dc2918f94f2be8437eac9fb/invoke.js"></script>
  `,
  rectangle: `
    <script>
      atOptions = {
        'key' : '7cb16260bdcfda5da5727d27253d8487',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    </script>
    <script src="https://www.highperformanceformat.com/7cb16260bdcfda5da5727d27253d8487/invoke.js"></script>
  `,
  'in-article': `
    <script>
      atOptions = {
        'key' : 'ce01cb9dea0aedcf7b64af77d9112df8',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    </script>
    <script src="https://www.highperformanceformat.com/ce01cb9dea0aedcf7b64af77d9112df8/invoke.js"></script>
  `,
  'sticky-mobile': `
    <script>
      atOptions = {
        'key' : 'b7e18eaa0ea4f2026ee4d693936e0498',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    </script>
    <script src="https://www.highperformanceformat.com/b7e18eaa0ea4f2026ee4d693936e0498/invoke.js"></script>
  `,
  'in-feed': `
    <script>
      atOptions = {
        'key' : '7cb16260bdcfda5da5727d27253d8487',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    </script>
    <script src="https://www.highperformanceformat.com/7cb16260bdcfda5da5727d27253d8487/invoke.js"></script>
  `,
};

const ADSTERRA_SOCIAL_BAR = `https://pl30448492.effectivecpmnetwork.com/5c/2d/46/5c2d4630c6bae696ebf1cc3aa9b65cd8.js`;

// ─── Adsterra iframe renderer ───────────────────────────────────────────────
function AdsterraAd({ variant, className }: { variant: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || loadedRef.current) return;
    loadedRef.current = true;

    const raw = ADSTERRA_SCRIPTS[variant];
    if (!raw) return;

    // Ekstrak key, format, height, width dari konfigurasi
    const key = raw.match(/'key'\s*:\s*'([^']+)'/)?.[1];
    const fmt = raw.match(/'format'\s*:\s*'([^']+)'/)?.[1] || 'iframe';
    const h = raw.match(/'height'\s*:\s*(\d+)/)?.[1];
    const w = raw.match(/'width'\s*:\s*(\d+)/)?.[1];

    if (!key) return;

    // Set global atOptions
    (window as any).atOptions = {
      key,
      format: fmt,
      ...(h ? { height: Number(h) } : {}),
      ...(w ? { width: Number(w) } : {}),
      params: {},
    };

    // Buat script element untuk invoke.js (bukan innerHTML)
    const script = document.createElement('script');
    script.src = `https://www.highperformanceformat.com/${key}/invoke.js`;
    script.async = true;
    containerRef.current.appendChild(script);
  }, [variant]);

  return <div ref={containerRef} className={className} />;
}

// ─── Placeholder configs ──────────────────────────────────────────────────────
interface AdUnitProps {
  variant: 'leaderboard' | 'rectangle' | 'in-feed' | 'in-article' | 'sticky-mobile';
  className?: string;
}

const PLACEHOLDER_CONFIGS = {
  leaderboard: {
    label: 'Iklan',
    width: 'w-full max-w-[728px] mx-auto',
    height: 'h-[90px]',
    text: '728 × 90 — Leaderboard',
    bg: 'bg-[#F2F4F7] dark:bg-[#1E293B]/40',
  },
  rectangle: {
    label: 'Iklan',
    width: 'w-full max-w-[300px] mx-auto',
    height: 'h-[250px]',
    text: '300 × 250 — Medium Rectangle',
    bg: 'bg-[#F2F4F7] dark:bg-[#1E293B]/40',
  },
  'in-feed': {
    label: 'Sponsor',
    width: 'w-full',
    height: 'h-auto',
    text: '',
    bg: 'bg-[#F2F4F7] dark:bg-[#1E293B]/40',
  },
  'in-article': {
    label: 'Iklan',
    width: 'w-full max-w-[468px] mx-auto',
    height: 'h-[60px]',
    text: '468 × 60 — Banner Artikel',
    bg: 'bg-[#F2F4F7] dark:bg-[#1E293B]/40',
  },
  'sticky-mobile': {
    label: 'Iklan',
    width: 'w-full max-w-[320px]',
    height: 'h-[50px]',
    text: '320 × 50 — Mobile Banner',
    bg: 'bg-white dark:bg-[#0E1330]',
  },
};

// ─── Main AdUnit component ────────────────────────────────────────────────────
export function AdUnit({ variant, className }: AdUnitProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // ── STICKY MOBILE ──────────────────────────────────────────────────────────
  if (variant === 'sticky-mobile') {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-center bg-white dark:bg-[#0E1330] border-t border-border/50 shadow-lg"
        data-testid="ad-unit-sticky-mobile"
      >
        <div className="w-full max-w-[320px] h-[50px] overflow-hidden mx-auto">
          <AdsterraAd variant="sticky-mobile" className="w-full h-full" />
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
          aria-label="Tutup iklan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── IN-FEED ────────────────────────────────────────────────────────────────
  if (variant === 'in-feed') {
    return (
      <div className={cn('w-full overflow-hidden', className)} data-testid="ad-unit-in-feed">
        <AdsterraAd variant="in-feed" className="w-full" />
      </div>
    );
  }

  // ── LEADERBOARD, RECTANGLE, IN-ARTICLE ────────────────────────────────────
  const config = PLACEHOLDER_CONFIGS[variant];

  return (
    <div className={cn('flex flex-col items-center gap-1.5 py-2.5', className)} data-testid={`ad-unit-${variant}`}>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-semibold">{config.label}</span>
      <div className={cn('overflow-hidden', config.width)}>
        <AdsterraAd variant={variant} className={cn('flex items-center justify-center', config.height)} />
      </div>
    </div>
  );
}
