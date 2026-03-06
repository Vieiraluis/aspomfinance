import { useMemo, useState } from 'react';
import { useAccounts, useBankAccounts } from '@/hooks/useSupabaseData';
import { BankAccount } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Building2, Loader2, Filter } from 'lucide-react';

export function BankAccountTransactions() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: bankAccounts = [] } = useBankAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Filter only paid accounts that have a bank_account_id
  const paidAccounts = useMemo(() => {
    return accounts
      .filter(a => a.status === 'paid' && a.bankAccountId)
      .sort((a, b) => {
        // Sort by paid date descending
        const dateA = a.paidAt ? a.paidAt.getTime() : 0;
        const dateB = b.paidAt ? b.paidAt.getTime() : 0;
        return dateB - dateA;
      });
  }, [accounts]);

  // Group by bank account
  const grouped = useMemo(() => {
    const bankMap = new Map<string, BankAccount>();
    bankAccounts.forEach(ba => bankMap.set(ba.id, ba));

    const filtered = selectedAccountId === 'all'
      ? paidAccounts
      : paidAccounts.filter(a => a.bankAccountId === selectedAccountId);

    const groups: Record<string, {
      bankAccount: BankAccount;
      entries: typeof filtered;
      totalPayables: number;
      totalReceivables: number;
    }> = {};

    filtered.forEach(account => {
      const baId = account.bankAccountId!;
      if (!groups[baId]) {
        groups[baId] = {
          bankAccount: bankMap.get(baId) || { id: baId, name: 'Conta não encontrada' } as BankAccount,
          entries: [],
          totalPayables: 0,
          totalReceivables: 0,
        };
      }
      groups[baId].entries.push(account);
      if (account.type === 'payable') {
        groups[baId].totalPayables += account.amount;
      } else {
        groups[baId].totalReceivables += account.amount;
      }
    });

    return Object.values(groups).sort((a, b) =>
      a.bankAccount.name.localeCompare(b.bankAccount.name)
    );
  }, [paidAccounts, bankAccounts, selectedAccountId]);

  const totalPayables = grouped.reduce((s, g) => s + g.totalPayables, 0);
  const totalReceivables = grouped.reduce((s, g) => s + g.totalReceivables, 0);

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filtrar por conta:</span>
        </div>
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Todas as contas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {bankAccounts.map(ba => (
              <SelectItem key={ba.id} value={ba.id}>
                {ba.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <TrendingDown className="w-5 h-5 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">Total Pagamentos</p>
            <p className="font-semibold text-destructive">{formatCurrency(totalPayables)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
          <TrendingUp className="w-5 h-5 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">Total Recebimentos</p>
            <p className="font-semibold text-success">{formatCurrency(totalReceivables)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Building2 className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Saldo Movimentações</p>
            <p className={cn(
              "font-semibold",
              totalReceivables - totalPayables >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(totalReceivables - totalPayables)}
            </p>
          </div>
        </div>
      </div>

      {/* Grouped tables */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mb-3 opacity-50" />
          <p>Nenhuma movimentação encontrada</p>
        </div>
      ) : (
        grouped.map(group => (
          <div key={group.bankAccount.id} className="glass-card overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{group.bankAccount.name}</h3>
                  {group.bankAccount.bankName && (
                    <p className="text-xs text-muted-foreground">{group.bankAccount.bankName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-destructive font-medium">
                  Saídas: {formatCurrency(group.totalPayables)}
                </span>
                <span className="text-success font-medium">
                  Entradas: {formatCurrency(group.totalReceivables)}
                </span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor/Cliente</TableHead>
                  <TableHead>Data Pgto</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          entry.type === 'payable'
                            ? 'bg-destructive/10 text-destructive border-destructive/30'
                            : 'bg-success/10 text-success border-success/30'
                        )}
                      >
                        {entry.type === 'payable' ? 'Pagamento' : 'Recebimento'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell>{entry.supplierName || '—'}</TableCell>
                    <TableCell>{entry.paidAt ? formatDate(entry.paidAt) : '—'}</TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      entry.type === 'payable' ? "text-destructive" : "text-success"
                    )}>
                      {entry.type === 'payable' ? '- ' : '+ '}{formatCurrency(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      )}
    </div>
  );
}
