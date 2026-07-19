import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g., '/category/teknologi' or '/trending'
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  const prevHref = `${basePath}?page=${currentPage - 1}`;
  const nextHref = `${basePath}?page=${currentPage + 1}`;

  const activeClasses =
    'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-border bg-card text-foreground hover:bg-secondary hover:text-primary transition-colors duration-200';
  const disabledClasses =
    'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-border/40 bg-card text-muted-foreground opacity-50 cursor-not-allowed select-none';

  return (
    <nav
      aria-label="Navigasi halaman"
      className="flex items-center justify-center gap-4 mt-8"
    >
      {isPrevDisabled ? (
        <span className={disabledClasses} aria-disabled="true">
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </span>
      ) : (
        <Link href={prevHref} className={activeClasses}>
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </Link>
      )}

      <span className="text-sm text-muted-foreground font-medium px-2">
        Halaman {currentPage} dari {totalPages}
      </span>

      {isNextDisabled ? (
        <span className={disabledClasses} aria-disabled="true">
          Berikutnya
          <ChevronRight className="w-4 h-4" />
        </span>
      ) : (
        <Link href={nextHref} className={activeClasses}>
          Berikutnya
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </nav>
  );
}
