import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface VisitRow {
  visitante_nome: string;
  documento?: string | null;
  destino_nome?: string | null;
  entrada_at: string;
  saida_at?: string | null;
  recepcionista_nome?: string | null;
  portaria_locais?: { nome: string } | null;
  employees?: { name: string } | null;
}

interface ExportOptions {
  visitas: VisitRow[];
  startDate?: Date;
  endDate?: Date;
  filename?: string;
}

const fmt = (value?: string | null) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '—');

export const exportPortariaPdf = ({ visitas, startDate, endDate, filename }: ExportOptions) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Controle de Acesso', pageWidth / 2, 16, { align: 'center' });

  const periodo =
    startDate && endDate
      ? `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`
      : startDate
        ? `A partir de: ${format(startDate, 'dd/MM/yyyy')}`
        : endDate
          ? `Até: ${format(endDate, 'dd/MM/yyyy')}`
          : 'Período: todos os registros';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(periodo, pageWidth / 2, 23, { align: 'center' });
  doc.text(`Emitido em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, 29, {
    align: 'center',
  });

  doc.setFontSize(9);
  doc.text(`Total de acessos: ${visitas.length}`, 14, 37);
  doc.text(
    `Ainda no prédio: ${visitas.filter((v) => !v.saida_at).length}`,
    pageWidth - 14,
    37,
    { align: 'right' }
  );

  const body = visitas.map((v, i) => [
    String(i + 1),
    v.visitante_nome,
    v.documento || '—',
    v.portaria_locais?.nome || v.destino_nome || '—',
    fmt(v.entrada_at),
    fmt(v.saida_at),
    v.employees?.name || v.recepcionista_nome || '—',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['#', 'Visitante', 'Documento', 'Destino', 'Entrada', 'Saída', 'Recepcionista']],
    body,
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 62 },
      2: { cellWidth: 32 },
      3: { cellWidth: 50 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
      6: { cellWidth: 50 },
    },
    margin: { left: 14, right: 14 },
  });

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Portaria e Controle de Acesso • Documento gerado automaticamente', pageWidth / 2, pageHeight - 8, {
    align: 'center',
  });

  doc.save(`${filename || `controle-acesso-${format(new Date(), 'yyyy-MM-dd')}`}.pdf`);
};
