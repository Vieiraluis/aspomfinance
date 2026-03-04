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
  Wallet,
  ArrowLeftRight,
  LogOut,
  Settings } from
'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DueDateNotifications } from '@/components/notifications/DueDateNotifications';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const mainNavigation = [
{ name: 'Dashboard', href: '/', icon: LayoutDashboard },
{ name: 'Cadastro', href: '/suppliers', icon: Users },
{ name: 'Contas a Pagar', href: '/payables', icon: TrendingDown },
{ name: 'Contas a Receber', href: '/receivables', icon: TrendingUp },
{ name: 'Baixa de Conciliação', href: '/payments', icon: CreditCard },
{ name: 'Contas Bancárias', href: '/bank-accounts', icon: Wallet },
{ name: 'Fluxo de Caixa', href: '/cash-flow', icon: ArrowLeftRight },
{ name: 'Todos os Registros', href: '/all-records', icon: ListChecks },
{ name: 'Configurações', href: '/settings', icon: Settings }];


const reportsNavigation = [
{ name: 'Visão Geral', href: '/reports', icon: BarChart3 },
{ name: 'Consolidado Mensal', href: '/reports/consolidated', icon: BarChart3 },
{ name: 'Rel. Contas a Pagar', href: '/reports/payables', icon: FileSpreadsheet },
{ name: 'Rel. Contas a Receber', href: '/reports/receivables', icon: FileSpreadsheet },
{ name: 'Contas Pagas', href: '/reports/paid-payables', icon: FileSpreadsheet },
{ name: 'Contas Recebidas', href: '/reports/received-payments', icon: FileSpreadsheet }];


export function Sidebar() {
  const location = useLocation();
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith('/reports'));
  const { signOut, user } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">Gestão Financeira</h1>
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
                isActive ?
                'bg-sidebar-accent text-sidebar-primary shadow-glow-primary/20' :
                'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}>
              
              <item.icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-sidebar-primary' : ''
              )} />
              {item.name}
            </Link>);

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
                    isActive ?
                    'bg-sidebar-accent text-sidebar-primary shadow-glow-primary/20' :
                    'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}>
                  
                  <item.icon className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-sidebar-primary' : ''
                  )} />
                  {item.name}
                </Link>);

            })}
          </CollapsibleContent>
        </Collapsible>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {user &&
        <div className="px-2 py-1">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        }
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}>
          
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>);

}