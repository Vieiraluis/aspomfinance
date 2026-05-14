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
  Settings,
  UserCog,
  CalendarDays,
  Building2,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { DueDateNotifications } from '@/components/notifications/DueDateNotifications';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

type NavItem = { name: string; href: string; icon: any };

const dashboardItem: NavItem = { name: 'Dashboard', href: '/', icon: LayoutDashboard };
const cadastroItem: NavItem = { name: 'Cadastro', href: '/suppliers', icon: Users };

const financeiroItems: NavItem[] = [
  { name: 'Contas a Pagar', href: '/payables', icon: TrendingDown },
  { name: 'Contas a Receber', href: '/receivables', icon: TrendingUp },
  { name: 'Baixa de Conciliação', href: '/payments', icon: CreditCard },
  { name: 'Contas Bancárias', href: '/bank-accounts', icon: Building2 },
  { name: 'Fluxo de Caixa', href: '/cash-flow', icon: ArrowLeftRight },
  { name: 'Todos os Registros', href: '/all-records', icon: ListChecks },
];

const rhItem: NavItem = { name: 'Gestão de RH', href: '/hr', icon: UserCog };
const eventosItem: NavItem = { name: 'Eventos', href: '/events', icon: CalendarDays };

const associadosItems: NavItem[] = [
  { name: 'Painel', href: '/associados/dashboard', icon: BarChart3 },
  { name: 'Associados', href: '/associados', icon: Users },
  { name: 'Mensalidades', href: '/associados/mensalidades', icon: CreditCard },
];

const reportsItems: NavItem[] = [
  { name: 'Visão Geral', href: '/reports', icon: BarChart3 },
  { name: 'Consolidado Mensal', href: '/reports/consolidated', icon: BarChart3 },
  { name: 'Extrato Entradas/Saídas', href: '/reports/cash-statement', icon: FileSpreadsheet },
  { name: 'Rel. Contas a Pagar', href: '/reports/payables', icon: FileSpreadsheet },
  { name: 'Rel. Contas a Receber', href: '/reports/receivables', icon: FileSpreadsheet },
  { name: 'Contas Pagas', href: '/reports/paid-payables', icon: FileSpreadsheet },
  { name: 'Contas Recebidas', href: '/reports/received-payments', icon: FileSpreadsheet },
  { name: 'Ficha Financeira', href: '/reports/by-supplier', icon: FileSpreadsheet },
];

interface HoverDropdownProps {
  label: string;
  icon: any;
  items: NavItem[];
  isGroupActive: boolean;
}

function HoverDropdown({ label, icon: Icon, items, isGroupActive }: HoverDropdownProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const handleEnter = () => {
    if (closeTimer) clearTimeout(closeTimer);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave} className="relative">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isGroupActive
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={4}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="min-w-[220px]"
        >
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <DropdownMenuItem key={item.name} asChild>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface SimpleLinkProps {
  item: NavItem;
}

function SimpleLink({ item }: SimpleLinkProps) {
  const location = useLocation();
  const isActive =
    location.pathname === item.href ||
    (item.href !== '/' && location.pathname.startsWith(item.href + '/'));
  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      <item.icon className="w-4 h-4" />
      {item.name}
    </Link>
  );
}

export function TopNav() {
  const location = useLocation();
  const { signOut, user } = useAuthContext();

  const financeiroActive = financeiroItems.some((i) => location.pathname.startsWith(i.href));
  const reportsActive = location.pathname.startsWith('/reports');
  const associadosActive = location.pathname.startsWith('/associados');

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-sidebar border-b border-sidebar-border hidden md:flex items-center justify-between px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
          <CreditCard className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="hidden lg:block">
          <h1 className="font-display font-bold text-base text-foreground leading-tight">
            Gestão Financeira
          </h1>
        </div>
      </Link>

      {/* Center nav */}
      <nav className="flex items-center gap-1 flex-1 justify-center">
        <SimpleLink item={dashboardItem} />
        <SimpleLink item={cadastroItem} />
        <HoverDropdown
          label="Financeiro"
          icon={Wallet}
          items={financeiroItems}
          isGroupActive={financeiroActive}
        />
        <SimpleLink item={rhItem} />
        <SimpleLink item={eventosItem} />
        <HoverDropdown
          label="Associados"
          icon={Shield}
          items={associadosItems}
          isGroupActive={associadosActive}
        />
        <HoverDropdown
          label="Relatórios"
          icon={BarChart3}
          items={reportsItems}
          isGroupActive={reportsActive}
        />
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        <DueDateNotifications />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserIcon className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[220px]">
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Conectado como</span>
                    <span className="text-sm truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
