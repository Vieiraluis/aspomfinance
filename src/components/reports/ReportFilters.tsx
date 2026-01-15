import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer, ArrowUpDown } from 'lucide-react';

interface ReportFiltersProps {
  sortBy: 'dueDate' | 'name' | 'description' | 'amount';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: 'dueDate' | 'name' | 'description' | 'amount') => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onPrint: () => void;
}

export const ReportFilters = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  onPrint,
}: ReportFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 no-print">
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
      
      <Button onClick={onPrint} className="ml-auto">
        <Printer className="w-4 h-4 mr-2" />
        Imprimir Relatório
      </Button>
    </div>
  );
};
