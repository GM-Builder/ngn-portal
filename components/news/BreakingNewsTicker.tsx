'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { BreakingNews } from '@/types';

interface TickerProps {
  items: BreakingNews[];
}

export default function BreakingNewsTicker({ items }: TickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const currentNews = items[currentIndex];

  return (
    <div className="w-full bg-accent text-accent-foreground py-3 border-b border-accent/25">
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex items-center">
        <div className="flex items-center font-heading font-bold text-xs tracking-wider uppercase shrink-0 mr-4 whitespace-nowrap bg-accent-foreground text-accent px-2 py-0.5 animate-pulse">
          <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
          Breaking News
        </div>
        <div className="flex-1 relative h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNews.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center"
            >
              {currentNews.article_id ? (
                <Link
                  href={`/article/${currentNews.article_id}/${currentNews.article_slug || 'breaking'}`}
                  className="hover:underline flex items-center text-sm font-semibold tracking-wide hover:text-accent-foreground/90 transition-colors"
                >
                  <span className="line-clamp-1">{currentNews.text}</span>
                  <ChevronRight className="w-4 h-4 ml-1 inline-block shrink-0 opacity-80" />
                </Link>
              ) : (
                <span className="text-sm font-semibold tracking-wide line-clamp-1">
                  {currentNews.text}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
