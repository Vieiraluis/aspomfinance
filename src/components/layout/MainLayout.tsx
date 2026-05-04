import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';
import { useOverdueSync } from '@/hooks/useOverdueSync';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Sincroniza status de contas vencidas ao montar
  useOverdueSync();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Top Navigation */}
      <TopNav />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main content */}
      <main className="min-h-screen pt-14 md:pt-16">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
