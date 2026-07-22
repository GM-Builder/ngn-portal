import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getCategories } from '@/lib/queries/categories';
import { AdUnit, MonetagInPagePush, MonetagVignette, MonetagSW } from '@/components/news/AdUnit';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <MonetagInPagePush />
      <MonetagVignette />
      <MonetagSW />
      <Navbar categories={categories} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 pb-16">
        {children}
      </main>
      <Footer />
      <AdUnit variant="sticky-mobile" />
    </div>
  );
}

