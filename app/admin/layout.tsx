import { createAuthClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Radio,
  LogOut,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, it's either the login page or unauthorized redirecting to login.
  // Just render the page directly (login form).
  if (!user) {
    return <div className="min-h-screen bg-secondary/30">{children}</div>;
  }

  // Admin Logout Server Action
  const handleLogout = async () => {
    'use server';
    const supabase = await createAuthClient();
    await supabase.auth.signOut();
    redirect('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-secondary/10">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col border-r border-primary/20 shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-primary-foreground/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="relative h-8 w-24">
              <Image
                src="/logos/NGN.png"
                alt="NGN Logo"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 font-bold uppercase tracking-wider">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-none hover:bg-primary-foreground/10 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>
          <Link
            href="/admin/articles"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-none hover:bg-primary-foreground/10 transition-colors"
          >
            <FileText className="w-4 h-4 shrink-0" />
            Kelola Artikel
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-none hover:bg-primary-foreground/10 transition-colors"
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            Kelola Kategori
          </Link>
          <Link
            href="/admin/breaking"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-none hover:bg-primary-foreground/10 transition-colors"
          >
            <Radio className="w-4 h-4 shrink-0" />
            Running Ticker
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-primary-foreground/10 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold hover:text-accent transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Portal
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          
          <form action={handleLogout}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-red-300 hover:text-red-100 hover:bg-red-950/20 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
          <div className="text-xs text-muted-foreground font-semibold">
            Masuk sebagai: <span className="text-foreground font-bold">{user.email}</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
