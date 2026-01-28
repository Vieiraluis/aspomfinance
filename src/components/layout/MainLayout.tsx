import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useOverdueSync } from '@/hooks/useOverdueSync';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Sincroniza status de contas vencidas ao montar
  useOverdueSync();
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
