import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Account } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/format';
import { format } from 'date-fns';

interface ExportPdfOptions {
  title: string;
  accounts: Account[];
  sortBy: 'dueDate' | 'name' | 'description' | 'amount';
  sortOrder: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  filename: string;
  dateField?: 'dueDate' | 'paidAt';
  dateColumnLabel?: string;
}

export const exportToPdf = ({
  title,
  accounts,
  sortBy,
  sortOrder,
  startDate,
  endDate,
  filename,
  dateField = 'dueDate',
  dateColumnLabel = 'Data Venc.',
}: ExportPdfOptions) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  const getDateValue = (account: Account) => {
    if (dateField === 'paidAt' && account.paidAt) {
      return new Date(account.paidAt);
    }
    return new Date(account.dueDate);
  };

  // Sort accounts
  const sortedAccounts = [...accounts].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'dueDate':
        comparison = getDateValue(a).getTime() - getDateValue(b).getTime();
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
  
  const periodText = startDate && endDate 
    ? `Período: ${format(startDate, 'dd/MM/yyyy')} até ${format(endDate, 'dd/MM/yyyy')}`
    : startDate 
      ? `A partir de: ${format(startDate, 'dd/MM/yyyy')}`
      : endDate 
        ? `Até: ${format(endDate, 'dd/MM/yyyy')}`
        : 'Período: Todos os registros';

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${formatDate(new Date())}`, 105, 28, { align: 'center' });
  doc.text(periodText, 105, 34, { align: 'center' });
  
  // Summary line
  doc.setFontSize(9);
  doc.text(`Total de registros: ${accounts.length}`, 14, 44);
  
  const sortLabel = sortBy === 'dueDate' ? 'Data de Vencimento' : 
                    sortBy === 'name' ? 'Nome' : 
                    sortBy === 'description' ? 'Descrição' : 'Valor';
  doc.text(`Ordenado por: ${sortLabel} (${sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})`, 196, 44, { align: 'right' });

  // Table
  const tableData = sortedAccounts.map((account, index) => [
    (index + 1).toString(),
    formatDate(dateField === 'paidAt' && account.paidAt ? account.paidAt : account.dueDate),
    account.supplierName || '-',
    account.description.length > 40 ? account.description.substring(0, 40) + '...' : account.description,
    formatCurrency(account.amount),
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['#', dateColumnLabel, 'Nome', 'Descrição', 'Valor']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { cellWidth: 70 },
      4: { cellWidth: 35, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 14, right: 14 },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  doc.setDrawColor(66, 66, 66);
  doc.setLineWidth(0.5);
  doc.line(14, finalY + 5, 196, finalY + 5);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: ${formatCurrency(total)}`, 196, finalY + 15, { align: 'right' });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('Sistema de Gestão Financeira • Relatório gerado automaticamente', 105, pageHeight - 10, { align: 'center' });

  // Save
  doc.save(`${filename}.pdf`);
};
