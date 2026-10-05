import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, FilePlus2, Layers, Receipt } from 'lucide-react';

interface FinancialActionsMenuProps {
  entryPath: string;
  selectedCount: number;
  hasPaidAccounts: boolean;
  onBatchReceipts: () => void;
  onGroupedReceipt: () => void;
}

export function FinancialActionsMenu({
  entryPath,
  selectedCount,
  hasPaidAccounts,
  onBatchReceipts,
  onGroupedReceipt,
}: FinancialActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
          Ações e ferramentas
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Lançamentos financeiros
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className="gap-2 text-xs font-medium">
          <Link to={entryPath}>
            <FilePlus2 className="h-4 w-4 text-primary" />
            Novo lançamento
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-xs"
          disabled={!hasPaidAccounts}
          onSelect={onBatchReceipts}
        >
          <Receipt className="h-4 w-4" />
          Recibos em lote
          <span className="ml-auto text-muted-foreground">{selectedCount}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 text-xs"
          disabled={!hasPaidAccounts}
          onSelect={onGroupedReceipt}
        >
          <Layers className="h-4 w-4" />
          Agrupar em 1 recibo
          <span className="ml-auto text-muted-foreground">{selectedCount}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}