import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Menu,
  Settings,
  X,
  Users,
  BarChart3,
  Wallet,
  ArrowLeftRight,
  ListChecks,
  FileSpreadsheet,
  LogOut,
  UserCog,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthContext } from '@/contexts/AuthContext';
import { DueDateNotifications } from '@/components/notifications/DueDateNotifications';

const topNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cadastro', href: '/suppliers', icon: Users },
];

const financeiroNavigation = [
  { name: 'Contas a Pagar', href: '/payables', icon: TrendingDown },
  { name: 'Contas a Receber', href: '/receivables', icon: TrendingUp },
  { name: 'Baixa de Conciliação', href: '/payments', icon: CreditCard },
  { name: 'Fluxo de Caixa', href: '/cash-flow', icon: ArrowLeftRight },
  { name: 'Todos os Registros', href: '/all-records', icon: ListChecks },
];

const bottomNavigation = [
  { name: 'Gestão de RH', href: '/hr', icon: UserCog },
  { name: 'Eventos', href: '/events', icon: CalendarDays },
];

const reportsNavigation = [
  { name: 'Visão Geral', href: '/reports', icon: BarChart3 },
  { name: 'Consolidado Mensal', href: '/reports/consolidated', icon: BarChart3 },
  { name: 'Rel. Contas a Pagar', href: '/reports/payables', icon: FileSpreadsheet },
  { name: 'Rel. Contas a Receber', href: '/reports/receivables', icon: FileSpreadsheet },
  { name: 'Contas Pagas', href: '/reports/paid-payables', icon: FileSpreadsheet },
  { name: 'Contas Recebidas', href: '/reports/received-payments', icon: FileSpreadsheet },
  { name: 'Ficha Financeira', href: '/reports/by-supplier', icon: FileSpreadsheet },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-foreground">FinanceApp</span>
      </div>
      
      <div className="flex items-center gap-2">
        <DueDateNotifications />
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-foreground">FinanceApp</span>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-3.5rem)]">
              <nav className="p-4 space-y-1">
                {topNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.name} to={item.href} onClick={() => setOpen(false)} className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}>
                      <item.icon className={cn('w-5 h-5', isActive ? 'text-sidebar-primary' : '')} />
                      {item.name}
                    </Link>
                  );
                })}
                
                <div className="pt-4 pb-2">
                  <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financeiro</span>
                </div>
                {financeiroNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.name} to={item.href} onClick={() => setOpen(false)} className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}>
                      <item.icon className={cn('w-4 h-4', isActive ? 'text-sidebar-primary' : '')} />
                      {item.name}
                    </Link>
                  );
                })}

                {bottomNavigation.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  return (
                    <Link key={item.name} to={item.href} onClick={() => setOpen(false)} className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mt-1',
                      isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}>
                      <item.icon className={cn('w-5 h-5', isActive ? 'text-sidebar-primary' : '')} />
                      {item.name}
                    </Link>
                  );
                })}

                <div className="pt-4 pb-2">
                  <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Relatórios</span>
                </div>
                {reportsNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.name} to={item.href} onClick={() => setOpen(false)} className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}>
                      <item.icon className={cn('w-4 h-4', isActive ? 'text-sidebar-primary' : '')} />
                      {item.name}
                    </Link>
                  );
                })}

                <Link to="/settings" onClick={() => setOpen(false)} className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mt-1',
                  location.pathname === '/settings' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}>
                  <Settings className={cn('w-5 h-5', location.pathname === '/settings' ? 'text-sidebar-primary' : '')} />
                  Configurações
                </Link>

                <div className="pt-6">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
