import { forwardRef, useMemo } from 'react';
import { Account } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/format';
import { sumMoney } from '@/lib/money';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import {
  PriorityLevel,
  priorityConfig,
  priorityOrder,
  getPriority,
  daysOverdue,
  categoryLabel,
} from '@/lib/paymentPriority';

interface PriorityReportProps {
  title: string;
  accounts: Account[];
  startDate?: Date;
  endDate?: Date;
}

export const PriorityReport = forwardRef<HTMLDivElement, PriorityReportProps>(
  ({ title, accounts, startDate, endDate }, ref) => {
    const groups = useMemo(() => {
      const map: Record<PriorityLevel, Account[]> = {
        critical: [], high: [], medium: [], low: [],
      };
      accounts.forEach((a) => map[getPriority(a)].push(a));
      priorityOrder.forEach((level) => {
        map[level].sort((a, b) => daysOverdue(b) - daysOverdue(a) || b.amount - a.amount);
      });
      return priorityOrder
        .map((level) => ({
          level,
          config: priorityConfig[level],
          accounts: map[level],
          total: sumMoney(map[level], (a) => a.amount),
          overdue: sumMoney(map[level].filter((a) => daysOverdue(a) > 0), (a) => a.amount),
        }))
        .filter((g) => g.accounts.length > 0);
    }, [accounts]);

    const total = sumMoney(accounts, (a) => a.amount);
    const overdueTotal = sumMoney(accounts.filter((a) => daysOverdue(a) > 0), (a) => a.amount);

    const periodText = startDate && endDate
      ? `Período: ${format(startDate, 'dd/MM/yyyy')} até ${format(endDate, 'dd/MM/yyyy')}`
      : startDate
        ? `A partir de: ${format(startDate, 'dd/MM/yyyy')}`
        : endDate
          ? `Até: ${format(endDate, 'dd/MM/yyyy')}`
          : 'Período: Todos os registros';

    return (
      <div ref={ref} className="print-report bg-white text-black p-8 min-h-[297mm] w-[210mm] mx-auto">
        <style>
          {`
            @media print {
              @page { size: A4; margin: 12mm; }
              .print-report * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-report tr { page-break-inside: avoid; }
              .print-report thead { display: table-header-group; }
              .no-print { display: none !important; }
            }
          `}
        </style>

        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-center text-gray-900">{title}</h1>
          <p className="text-xs text-center text-gray-600 mt-1">Gerado em: {formatDate(new Date())}</p>
          <p className="text-xs text-center text-gray-600 font-medium">{periodText}</p>
        </div>

        {/* Resumo por prioridade */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {priorityOrder.map((level) => {
            const g = groups.find((x) => x.level === level);
            const cfg = priorityConfig[level];
            return (
              <div key={level} className={`border-l-4 px-2 py-1.5 ${cfg.headerClass}`}>
                <div className="text-[10px] font-bold uppercase">{cfg.label}</div>
                <div className="text-sm font-mono font-bold">{formatCurrency(g?.total ?? 0)}</div>
                <div className="text-[10px]">{g?.accounts.length ?? 0} título(s)</div>
              </div>
            );
          })}
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhum registro encontrado no período selecionado</div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.level}>
                <div className={`px-3 py-1.5 border-l-4 border border-gray-300 ${group.config.headerClass}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{group.config.label}</span>
                    <span className="font-mono font-bold text-sm">{formatCurrency(group.total)}</span>
                  </div>
                  <div className="text-[10px]">{group.config.description}</div>
                </div>

                <Table className="border border-gray-300">
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="text-black font-bold border border-gray-300 w-8 py-1 text-xs">#</TableHead>
                      <TableHead className="text-black font-bold border border-gray-300 py-1 text-xs">Venc.</TableHead>
                      <TableHead className="text-black font-bold border border-gray-300 py-1 text-xs text-center">Atraso</TableHead>
                      <TableHead className="text-black font-bold border border-gray-300 py-1 text-xs">Nome</TableHead>
                      <TableHead className="text-black font-bold border border-gray-300 py-1 text-xs">Categoria</TableHead>
                      <TableHead className="text-black font-bold border border-gray-300 py-1 text-xs">Descrição</TableHead>
                      <TableHead className="text-black font-bold border border-gray-300 py-1 text-xs text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.accounts.map((account, index) => {
                      const late = daysOverdue(account);
                      return (
                        <TableRow key={account.id} className={group.config.rowClass}>
                          <TableCell className="border border-gray-300 text-center py-1 text-xs">{index + 1}</TableCell>
                          <TableCell className="border border-gray-300 py-1 text-xs whitespace-nowrap">{formatDate(account.dueDate)}</TableCell>
                          <TableCell className="border border-gray-300 py-1 text-xs text-center">
                            {late > 0 ? (
                              <span className={`inline-block px-1.5 rounded text-[10px] font-bold ${group.config.badgeClass}`}>
                                {late}d
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500">em dia</span>
                            )}
                          </TableCell>
                          <TableCell className="border border-gray-300 py-1 text-xs">{account.supplierName || '-'}</TableCell>
                          <TableCell className="border border-gray-300 py-1 text-[10px]">{categoryLabel(account.category)}</TableCell>
                          <TableCell className="border border-gray-300 py-1 text-xs">{account.description}</TableCell>
                          <TableCell className="border border-gray-300 py-1 text-xs text-right font-mono">{formatCurrency(account.amount)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="flex justify-end gap-3 mt-1 text-xs">
                  <span>Vencido no grupo: <strong className="font-mono">{formatCurrency(group.overdue)}</strong></span>
                  <span>Subtotal: <strong className="font-mono">{formatCurrency(group.total)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plano de organização */}
        {accounts.length > 0 && (
          <div className="mt-6 border border-gray-300 p-3">
            <h2 className="font-bold text-sm mb-2">Plano de Organização dos Pagamentos</h2>
            <ol className="list-decimal list-inside text-xs space-y-1 text-gray-800">
              <li><strong>1ª onda (imediata):</strong> quitar a prioridade crítica — salários, encargos e tributos, evitando multas e passivo trabalhista.</li>
              <li><strong>2ª onda (até 7 dias):</strong> prioridade alta — concessionárias, aluguel e obrigações bancárias, evitando corte de serviços e juros.</li>
              <li><strong>3ª onda (até 15 dias):</strong> prioridade média — fornecedores e serviços, negociando prazo/desconto à vista.</li>
              <li><strong>4ª onda (conforme caixa):</strong> prioridade baixa — despesas adiáveis; suspender o que não for essencial no mês.</li>
              <li><strong>Controle:</strong> direcionar a arrecadação do período nessa ordem e não permitir que nenhum título ultrapasse 30 dias de atraso.</li>
            </ol>
          </div>
        )}

        {/* Totais */}
        <div className="mt-4 pt-3 border-t-2 border-gray-800 flex justify-end gap-4">
          <div className="bg-gray-50 border border-gray-300 px-4 py-2 text-sm">
            <span className="font-semibold">Vencido: </span>
            <span className="font-bold font-mono">{formatCurrency(overdueTotal)}</span>
          </div>
          <div className="bg-gray-100 border border-gray-300 px-4 py-2">
            <span className="font-bold text-base">TOTAL: </span>
            <span className="font-bold text-base font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-gray-300 text-[10px] text-gray-500 text-center">
          Sistema de Gestão Financeira • Relatório de prioridades gerado automaticamente
        </div>
      </div>
    );
  }
);

PriorityReport.displayName = 'PriorityReport';
