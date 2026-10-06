import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Calendar, SlidersHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { CategorySelectOptions } from '@/components/accounts/CategorySelectOptions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  startDate?: Date | undefined;
  onStartDateChange?: (date: Date | undefined) => void;
  endDate?: Date | undefined;
  onEndDateChange?: (date: Date | undefined) => void;
  showCategoryFilter?: boolean;
  showDateFilter?: boolean;
  statusOptions?: { value: string; label: string }[];
  searchPlaceholder?: string;
  rightContent?: React.ReactNode;
  layout?: 'toolbar' | 'sidebar';
}

const defaultStatusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'paid', label: 'Pagos' },
  
];

export function AccountFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  showCategoryFilter = false,
  showDateFilter = false,
  statusOptions = defaultStatusOptions,
  searchPlaceholder = 'Buscar por descrição ou fornecedor...',
  rightContent,
  layout = 'toolbar',
}: AccountFiltersProps) {
  const [collapsed, setCollapsed] = useState(false);
  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    if (onCategoryFilterChange) onCategoryFilterChange('all');
    if (onStartDateChange) onStartDateChange(undefined);
    if (onEndDateChange) onEndDateChange(undefined);
  };

  const hasActiveFilters = 
    search !== '' || 
    statusFilter !== 'all' || 
    categoryFilter !== 'all' ||
    startDate !== undefined ||
    endDate !== undefined;

  const controls = (
    <>
        {/* Search */}
        <div className="filter-control relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="filter-control w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        {showCategoryFilter && onCategoryFilterChange && (
          <Select value={categoryFilter || 'all'} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="filter-control w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <CategorySelectOptions />

            </SelectContent>
          </Select>
        )}

        {/* Date Filters */}
        {showDateFilter && onStartDateChange && onEndDateChange && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'filter-control w-[130px] justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy') : 'Data início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'filter-control w-[130px] justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : 'Data fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}

        {/* Right Content */}
        {rightContent && layout === 'toolbar' && (
          <div className="ml-auto flex items-center gap-2">
            {rightContent}
          </div>
        )}
    </>
  );

  if (layout === 'sidebar') {
    return (
      <aside
        className={cn(
          'sticky top-20 self-start shrink-0 overflow-hidden rounded-md border border-border/70 bg-card/60 transition-[width] duration-200',
          collapsed ? 'w-11' : 'w-full lg:w-56',
        )}
      >
        <div className="flex h-10 items-center justify-between border-b border-border/60 px-2">
          {!collapsed && (
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              Filtros
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expandir filtros' : 'Recolher filtros'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        {!collapsed && (
          <div className="flex flex-col gap-2.5 p-3 [&_.filter-control]:w-full">
            {controls}
          </div>
        )}
      </aside>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 md:-mx-8 px-4 md:px-8 border-b border-border/40">
      <div className="flex flex-wrap gap-3 items-center">{controls}</div>
    </div>
  );
}
