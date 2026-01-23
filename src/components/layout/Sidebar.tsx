import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  TrendingDown,
  TrendingUp,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  ChevronDown,
  ListChecks,
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DueDateNotifications } from '@/components/notifications/DueDateNotifications';

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fornecedores', href: '/suppliers', icon: Users },
  { name: 'Contas a Pagar', href: '/payables', icon: TrendingDown },
  { name: 'Contas a Receber', href: '/receivables', icon: TrendingUp },
  { name: 'Baixa de Pagamentos', href: '/payments', icon: CreditCard },
  { name: 'Todos os Registros', href: '/all-records', icon: ListChecks },
];

const reportsNavigation = [
  { name: 'Visão Geral', href: '/reports', icon: BarChart3 },
  { name: 'Consolidado Mensal', href: '/reports/consolidated', icon: BarChart3 },
  { name: 'Rel. Contas a Pagar', href: '/reports/payables', icon: FileSpreadsheet },
  { name: 'Rel. Contas a Receber', href: '/reports/receivables', icon: FileSpreadsheet },
  { name: 'Contas Pagas', href: '/reports/paid-payables', icon: FileSpreadsheet },
  { name: 'Contas Recebidas', href: '/reports/received-payments', icon: FileSpreadsheet },
];

export function Sidebar() {
  const location = useLocation();
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith('/reports'));

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">FinanceApp</h1>
            <p className="text-xs text-muted-foreground">Gestão Financeira</p>
          </div>
        </div>
        <DueDateNotifications />
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-glow-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-sidebar-primary' : ''
              )} />
              {item.name}
            </Link>
          );
        })}
        
        {/* Reports Section with Collapsible */}
        <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5" />
              Relatórios
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform duration-200',
              reportsOpen && 'rotate-180'
            )} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1 ml-4">
            {reportsNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary shadow-glow-primary/20'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-sidebar-primary' : ''
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Versão 1.0</p>
          <p className="text-xs text-muted-foreground">
            Sistema de Gestão de Contas
          </p>
        </div>
      </div>
    </aside>
  );
}
