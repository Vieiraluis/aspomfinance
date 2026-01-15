import React, { forwardRef } from 'react';
import { Account } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PrintableReportProps {
  title: string;
  accounts: Account[];
  sortBy: 'dueDate' | 'name' | 'description' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ title, accounts, sortBy, sortOrder }, ref) => {
    const sortedAccounts = [...accounts].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'name':
          comparison = (a.supplierName || '').localeCompare(b.supplierName || '');
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = accounts.reduce((sum, a) => sum + a.amount, 0);

    return (
      <div ref={ref} className="print-report bg-white text-black p-8 min-h-[297mm] w-[210mm] mx-auto">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              .print-report {
                break-inside: auto;
              }
              .print-report table {
                page-break-inside: auto;
              }
              .print-report tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .print-report thead {
                display: table-header-group;
              }
              .print-report tfoot {
                display: table-footer-group;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>
        
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center text-gray-900">{title}</h1>
          <p className="text-sm text-center text-gray-600 mt-1">
            Gerado em: {formatDate(new Date())}
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 flex justify-between text-sm">
          <span>Total de registros: <strong>{accounts.length}</strong></span>
          <span>Ordenado por: <strong>
            {sortBy === 'dueDate' ? 'Data de Vencimento' : 
             sortBy === 'name' ? 'Nome' : 
             sortBy === 'description' ? 'Descrição' : 'Valor'}
          </strong> ({sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})</span>
        </div>

        {/* Table */}
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum registro encontrado
          </div>
        ) : (
          <Table className="border border-gray-300">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-black font-bold border border-gray-300 w-12">#</TableHead>
                <TableHead className="text-black font-bold border border-gray-300">Data Venc.</TableHead>
                <TableHead className="text-black font-bold border border-gray-300">Nome</TableHead>
                <TableHead className="text-black font-bold border border-gray-300">Descrição</TableHead>
                <TableHead className="text-black font-bold border border-gray-300 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAccounts.map((account, index) => (
                <TableRow key={account.id} className="hover:bg-gray-50">
                  <TableCell className="border border-gray-300 text-center">{index + 1}</TableCell>
                  <TableCell className="border border-gray-300">{formatDate(account.dueDate)}</TableCell>
                  <TableCell className="border border-gray-300">{account.supplierName || '-'}</TableCell>
                  <TableCell className="border border-gray-300">{account.description}</TableCell>
                  <TableCell className="border border-gray-300 text-right font-mono">
                    {formatCurrency(account.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Total Footer */}
        <div className="mt-6 pt-4 border-t-2 border-gray-800">
          <div className="flex justify-end">
            <div className="bg-gray-100 border border-gray-300 px-6 py-3 rounded">
              <span className="font-bold text-lg">TOTAL: </span>
              <span className="font-bold text-lg font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          Sistema de Gestão Financeira • Relatório gerado automaticamente
        </div>
      </div>
    );
  }
);

PrintableReport.displayName = 'PrintableReport';
