import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Printer, FileDown, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BankAccount } from '@/types/financial';

interface ReportFiltersProps {
  sortBy: 'dueDate' | 'name' | 'description' | 'amount';
  sortOrder: 'asc' | 'desc';
  startDate: Date | undefined;
  endDate: Date | undefined;
  onSortByChange: (value: 'dueDate' | 'name' | 'description' | 'amount') => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onPrint: () => void;
  onExportPdf: () => void;
  dateLabel?: string;
  bankAccounts?: BankAccount[];
  selectedBankAccountId?: string;
  onBankAccountChange?: (value: string) => void;
}

export const ReportFilters = ({
  sortBy,
  sortOrder,
  startDate,
  endDate,
  onSortByChange,
  onSortOrderChange,
  onStartDateChange,
  onEndDateChange,
  onPrint,
  onExportPdf,
  dateLabel = 'Período:',
  bankAccounts,
  selectedBankAccountId,
  onBankAccountChange,
}: ReportFiltersProps) => {
  return (
    <div className="space-y-4 no-print">
      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{dateLabel}</span>
          
          {/* Start Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Data inicial"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                locale={ptBR}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-muted-foreground">até</span>
          
          {/* End Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Data final"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                locale={ptBR}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          {/* Clear Filters */}
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onStartDateChange(undefined);
                onEndDateChange(undefined);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Bank Account Filter */}
        {bankAccounts && onBankAccountChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Conta Bancária:</span>
            <Select value={selectedBankAccountId || 'all'} onValueChange={onBankAccountChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Contas</SelectItem>
                {bankAccounts.filter(ba => ba.isActive).map(ba => (
                  <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Sort and Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Data de Vencimento</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="description">Descrição</SelectItem>
              <SelectItem value="amount">Valor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordem:</span>
          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Crescente</SelectItem>
              <SelectItem value="desc">Decrescente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" onClick={onExportPdf}>
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
};
