'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Category } from '@/types';
import Image from 'next/image';
import DarkModeToggle from '@/components/ui/DarkModeToggle';

interface NavbarProps {
  categories: Category[];
}

export default function Navbar({ categories }: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center">
          <button
            className="md:hidden mr-4 p-2 text-foreground hover:bg-secondary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-6 w-18 md:h-8 md:w-28">
              <Image
                src="/logos/Logo.png"
                alt="NGN Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 72px, 112px"
              />
            </div>
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-wide uppercase">
          <Link
            href="/trending"
            className={`transition-colors duration-200 hover:text-accent ${
              pathname === '/trending' ? 'text-accent border-b-2 border-accent pb-1' : 'text-muted-foreground'
            }`}
          >
            Trending
          </Link>
          {categories.map((cat) => {
            const href = `/category/${cat.slug}`;
            const isActive = pathname === href;
            return (
              <Link
                key={cat.id}
                href={href}
                className={`transition-colors duration-200 hover:text-primary ${
                  isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>

        {/* Action icons */}
        <div className="flex items-center space-x-2">
          <Link
            href="/search"
            className="p-2.5 rounded-full hover:bg-secondary text-foreground hover:text-primary transition-all duration-200"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <DarkModeToggle />
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background py-4 px-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-4 font-semibold text-base uppercase">
            <Link
              href="/"
              className={`pb-1 ${pathname === '/' ? 'text-accent' : 'text-muted-foreground'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Beranda
            </Link>
            <Link
              href="/trending"
              className={`pb-1 ${pathname === '/trending' ? 'text-accent' : 'text-muted-foreground'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Trending
            </Link>
            {categories.map((cat) => {
              const href = `/category/${cat.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={`pb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              );
            })}

          </nav>
        </div>
      )}
    </header>
  );
}
