import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'income' | 'expense' | 'warning';
  className?: string;
}

const variantStyles = {
  default: 'text-primary',
  income: 'text-success',
  expense: 'text-destructive',
  warning: 'text-warning',
};

const variantGlow = {
  default: 'shadow-glow-primary',
  income: 'shadow-glow-income',
  expense: 'shadow-glow-expense',
  warning: '',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      'stat-card hover-lift animate-slide-up',
      variantGlow[variant],
      className
    )}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className={cn(
            'p-2 rounded-lg bg-background/50',
            variantStyles[variant]
          )}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className={cn('text-3xl font-display font-bold', variantStyles[variant])}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
