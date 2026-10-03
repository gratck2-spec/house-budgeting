import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { LogoutButton } from '@/components/logout-button';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="flex items-center justify-between p-4 border-b">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <LogoutButton />
      </header>
      <main className="p-4 max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}