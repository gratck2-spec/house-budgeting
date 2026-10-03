import { BottomNav } from '@/components/bottom-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      <main className="p-4 max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}