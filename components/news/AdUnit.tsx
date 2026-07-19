'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Konfigurasi Iklan ────────────────────────────────────────────────────────
//
// Cara pakai:
// 1. Tambah variabel berikut ke .env.local kamu:
//
//    NEXT_PUBLIC_AD_PROVIDER=adsense          # atau: adsterra, atau kosongkan untuk placeholder
//    NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
//
//    # Slot ID per posisi iklan (dari dashboard AdSense > Iklan > Per unit iklan)
//    NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD=1234567890
//    NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE=0987654321
//    NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE=1122334455
//    NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED=5544332211
//    NEXT_PUBLIC_ADSENSE_SLOT_STICKY_MOBILE=9988776655
//
//    # Untuk Adsterra: salin kode <script> dari dashboard Adsterra,
//    # lalu tempel langsung di slot yang sesuai di bawah (lihat komentar ADSTERRA).
//
// 2. Restart dev server setelah mengubah .env.local
// ─────────────────────────────────────────────────────────────────────────────

const AD_PROVIDER = process.env.NEXT_PUBLIC_AD_PROVIDER ?? '';
const ADSENSE_PUB = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ?? '';

const ADSENSE_SLOTS: Record<string, string> = {
  leaderboard:   process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD    ?? '',
  rectangle:     process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE      ?? '',
  'in-article':  process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE     ?? '',
  'in-feed':     process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED        ?? '',
  'sticky-mobile': process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_MOBILE ?? '',
};

// Apakah iklan nyata aktif?
const isLiveAd = AD_PROVIDER === 'adsense' || AD_PROVIDER === 'adsterra';

// ─── AdSense unit component ───────────────────────────────────────────────────
interface AdSenseUnitProps {
  slot: string;
  format?: string;
  fullWidthResponsive?: boolean;
  className?: string;
}

function AdSenseUnit({ slot, format = 'auto', fullWidthResponsive = true, className }: AdSenseUnitProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      // @ts-expect-error — adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not yet loaded — safe to ignore
    }
  }, []);

  return (
    <ins
      ref={ref}
      className={cn('adsbygoogle block', className)}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_PUB}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  );
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
        {isLiveAd ? (
          <div className="w-full max-w-[320px] h-[50px] overflow-hidden mx-auto">
            {AD_PROVIDER === 'adsense' && ADSENSE_SLOTS['sticky-mobile'] ? (
              <AdSenseUnit
                slot={ADSENSE_SLOTS['sticky-mobile']}
                format="auto"
                className="w-[320px] h-[50px]"
              />
            ) : (
              // ── ADSTERRA sticky-mobile ──
              // Tempel kode <script> Adsterra kamu di sini:
              // <div dangerouslySetInnerHTML={{ __html: `<script>...</script>` }} />
              <div className="w-full h-full flex items-center justify-center bg-[#F2F4F7] dark:bg-[#1E293B]/40">
                <span className="text-[10px] text-muted-foreground/40 font-mono">Adsterra — sticky-mobile</span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-[320px] h-[50px] flex items-center justify-center bg-[#F2F4F7] dark:bg-[#1E293B]/40 mx-auto">
            <span className="text-[10px] font-mono text-muted-foreground/40 select-none">320 × 50 — Mobile Banner</span>
            <span className="absolute left-2 text-[9px] uppercase tracking-widest text-muted-foreground/45 font-semibold">Iklan</span>
          </div>
        )}
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
    if (isLiveAd) {
      return (
        <div className={cn('w-full overflow-hidden', className)} data-testid="ad-unit-in-feed">
          {AD_PROVIDER === 'adsense' && ADSENSE_SLOTS['in-feed'] ? (
            <AdSenseUnit slot={ADSENSE_SLOTS['in-feed']} format="fluid" />
          ) : (
            // ── ADSTERRA in-feed ──
            // Tempel kode <script> Adsterra kamu di sini:
            // <div dangerouslySetInnerHTML={{ __html: `<script>...</script>` }} />
            <div className="w-full h-32 flex items-center justify-center bg-[#F2F4F7] dark:bg-[#1E293B]/40">
              <span className="text-[10px] text-muted-foreground/40 font-mono">Adsterra — in-feed</span>
            </div>
          )}
        </div>
      );
    }

    // Placeholder in-feed
    return (
      <div
        className={cn(
          'relative flex flex-col h-full border border-border/30 overflow-hidden group cursor-pointer bg-[#F2F4F7] dark:bg-[#0E1330] hover:bg-[#E8EBF2] dark:hover:bg-[#1E293B]/60 transition-colors',
          className
        )}
        data-testid="ad-unit-in-feed"
      >
        <div className="aspect-[3/2] bg-gradient-to-br from-[#E8EBF2] to-[#D5DAE8] dark:from-[#1E293B]/60 dark:to-[#0F172A] flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#1B2A72]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1B2A72]/45 dark:text-[#38BDF8]/40">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground/40">Ruang Iklan</p>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-3/4" />
            <div className="h-3 bg-muted-foreground/10 rounded mb-1 w-full" />
            <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-accent font-extrabold border border-accent/35 px-2 py-0.5 rounded-sm">Sponsor</span>
            <span className="text-[10px] text-muted-foreground/40 font-mono">Pasang Iklan</span>
          </div>
        </div>
      </div>
    );
  }

  // ── LEADERBOARD, RECTANGLE, IN-ARTICLE ────────────────────────────────────
  const config = PLACEHOLDER_CONFIGS[variant];

  if (isLiveAd) {
    return (
      <div className={cn('flex flex-col items-center gap-1.5 py-2.5', className)} data-testid={`ad-unit-${variant}`}>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-semibold">{config.label}</span>
        <div className={cn('overflow-hidden', config.width)}>
          {AD_PROVIDER === 'adsense' && ADSENSE_SLOTS[variant] ? (
            <AdSenseUnit slot={ADSENSE_SLOTS[variant]} format="auto" className={config.height} />
          ) : (
            // ── ADSTERRA leaderboard / rectangle / in-article ──
            // Tempel kode <script> Adsterra kamu di sini sesuai variant:
            // <div dangerouslySetInnerHTML={{ __html: `<script>...</script>` }} />
            <div className={cn('flex items-center justify-center', config.width, config.height, config.bg)}>
              <span className="text-[11px] text-muted-foreground/40 font-mono">Adsterra — {variant}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Placeholder default
  return (
    <div className={cn('flex flex-col items-center gap-1.5 py-2.5', className)} data-testid={`ad-unit-${variant}`}>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-semibold">{config.label}</span>
      <div className={cn('relative flex items-center justify-center border border-dashed border-border/60 overflow-hidden transition-opacity hover:opacity-95 cursor-pointer', config.width, config.height, config.bg)}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-[11px] text-muted-foreground/40 font-mono select-none">{config.text}</p>
        </div>
        <span className="text-[11px] text-muted-foreground/25 font-semibold select-none">Advertisement</span>
      </div>
    </div>
  );
}
