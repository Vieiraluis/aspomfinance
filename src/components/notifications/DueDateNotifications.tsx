import { useEffect, useState } from 'react';
import { useFinancialStore } from '@/store/financialStore';
import { differenceInDays, isBefore, startOfDay, isToday } from 'date-fns';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  Clock, 
  X,
  ChevronRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/types/financial';

interface Notification {
  id: string;
  type: 'overdue' | 'due_today' | 'due_soon' | 'paid';
  account: Account;
  message: string;
  priority: number;
}

export const DueDateNotifications = () => {
  const { accounts } = useFinancialStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const today = startOfDay(new Date());
    const newNotifications: Notification[] = [];

    accounts.forEach((account) => {
      if (account.status === 'cancelled') return;
      if (dismissedIds.has(account.id)) return;

      const dueDate = startOfDay(new Date(account.dueDate));
      const daysUntilDue = differenceInDays(dueDate, today);
      const typeLabel = account.type === 'payable' ? 'pagar' : 'receber';

      // Recently paid (within last 24 hours)
      if (account.status === 'paid' && account.paidAt) {
        const paidDate = startOfDay(new Date(account.paidAt));
        const daysSincePaid = differenceInDays(today, paidDate);
        if (daysSincePaid <= 1) {
          newNotifications.push({
            id: `paid-${account.id}`,
            type: 'paid',
            account,
            message: `${account.description} - ${account.type === 'payable' ? 'Pagamento' : 'Recebimento'} confirmado`,
            priority: 0,
          });
        }
        return;
      }

      if (account.status !== 'pending' && account.status !== 'overdue') return;

      // Overdue
      if (isBefore(dueDate, today)) {
        const daysOverdue = Math.abs(daysUntilDue);
        newNotifications.push({
          id: `overdue-${account.id}`,
          type: 'overdue',
          account,
          message: `${account.description} - Vencida há ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} (${typeLabel})`,
          priority: 3,
        });
      }
      // Due today
      else if (isToday(dueDate)) {
        newNotifications.push({
          id: `today-${account.id}`,
          type: 'due_today',
          account,
          message: `${account.description} - Vence hoje (${typeLabel})`,
          priority: 2,
        });
      }
      // Due within 7 days
      else if (daysUntilDue <= 7) {
        newNotifications.push({
          id: `soon-${account.id}`,
          type: 'due_soon',
          account,
          message: `${account.description} - Vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''} (${typeLabel})`,
          priority: 1,
        });
      }
    });

    // Sort by priority (highest first)
    newNotifications.sort((a, b) => b.priority - a.priority);
    setNotifications(newNotifications);
  }, [accounts, dismissedIds]);

  const dismissNotification = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id.split('-')[1]]));
  };

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'overdue':
        return {
          bg: 'bg-destructive/10 border-destructive/30',
          icon: AlertTriangle,
          iconClass: 'text-destructive',
          badge: 'bg-destructive text-destructive-foreground',
          badgeText: 'Vencida',
        };
      case 'due_today':
        return {
          bg: 'bg-warning/10 border-warning/30',
          icon: Clock,
          iconClass: 'text-warning',
          badge: 'bg-warning text-warning-foreground',
          badgeText: 'Hoje',
        };
      case 'due_soon':
        return {
          bg: 'bg-primary/10 border-primary/30',
          icon: Bell,
          iconClass: 'text-primary',
          badge: 'bg-primary/20 text-primary',
          badgeText: 'Em breve',
        };
      case 'paid':
        return {
          bg: 'bg-success/10 border-success/30',
          icon: CheckCircle2,
          iconClass: 'text-success',
          badge: 'bg-success text-success-foreground',
          badgeText: 'Baixado',
        };
    }
  };

  const urgentCount = notifications.filter(n => n.type === 'overdue' || n.type === 'due_today').length;
  const totalCount = notifications.length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center animate-pulse",
              urgentCount > 0 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-primary text-primary-foreground"
            )}>
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Bell className="h-5 w-5 text-primary" />
            Notificações
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalCount} {totalCount === 1 ? 'aviso' : 'avisos'}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-6 pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-success mb-4" />
              <p className="text-muted-foreground font-medium">
                Nenhuma notificação pendente
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Você está em dia com suas contas!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const Icon = style.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                      style.bg
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100"
                      onClick={() => dismissNotification(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        notification.type === 'overdue' && "bg-destructive/20",
                        notification.type === 'due_today' && "bg-warning/20",
                        notification.type === 'due_soon' && "bg-primary/20",
                        notification.type === 'paid' && "bg-success/20"
                      )}>
                        <Icon className={cn("h-5 w-5", style.iconClass)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn("text-xs", style.badge)}>
                            {style.badgeText}
                          </Badge>
                          {notification.account.type === 'payable' ? (
                            <TrendingDown className="h-3 w-3 text-destructive" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-success" />
                          )}
                        </div>
                        
                        <p className="text-sm font-medium line-clamp-2 pr-6">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>Vencimento: {formatDate(notification.account.dueDate)}</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(notification.account.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {notification.type !== 'paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 gap-2 text-xs"
                        onClick={() => {
                          setIsOpen(false);
                          window.location.href = '/all-records';
                        }}
                      >
                        Ver detalhes
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
