import jsPDF from 'jspdf';
import { EspacoLocacao, LocacaoReserva } from '@/hooks/useLocacaoData';

const TURNO_LABEL: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

export function gerarContratoModelo(reserva: LocacaoReserva, espaco: EspacoLocacao): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CONTRATO DE LOCAÇÃO DE ESPAÇO PARA EVENTO', W / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const intro =
    'Pelo presente instrumento particular, as partes adiante qualificadas têm entre si justo e contratado o seguinte:';
  doc.text(doc.splitTextToSize(intro, W - 30), 15, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULA 1ª – DO OBJETO', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const obj = `O LOCADOR cede ao LOCATÁRIO, em caráter temporário, o espaço denominado "${espaco.nome}", com capacidade máxima de ${espaco.capacidade_maxima} pessoas, para a realização do evento "${reserva.tipo_evento || 'a ser definido'}".`;
  const objLines = doc.splitTextToSize(obj, W - 30);
  doc.text(objLines, 15, y);
  y += objLines.length * 5 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULA 2ª – DO LOCATÁRIO', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${reserva.cliente_nome}`, 15, y); y += 5;
  doc.text(`Documento: ${reserva.cliente_documento || '__________________'}`, 15, y); y += 5;
  doc.text(`Telefone: ${reserva.cliente_telefone || '__________________'}`, 15, y); y += 5;
  doc.text(`E-mail: ${reserva.cliente_email || '__________________'}`, 15, y); y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULA 3ª – DA DATA E TURNO', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Data do evento: ${fmtDate(reserva.data_evento)}`, 15, y); y += 5;
  doc.text(`Turno: ${TURNO_LABEL[reserva.turno]}`, 15, y); y += 5;
  if (reserva.hora_inicio || reserva.hora_fim) {
    doc.text(`Horário: ${reserva.hora_inicio || '--:--'} às ${reserva.hora_fim || '--:--'}`, 15, y); y += 5;
  }
  doc.text(`Total de lugares contratados: ${reserva.total_lugares}`, 15, y); y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULA 4ª – DO VALOR', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Valor total da locação: ${fmtBRL(Number(reserva.valor_total) || 0)}`, 15, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULA 5ª – DAS OBRIGAÇÕES', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const obrig =
    'O LOCATÁRIO compromete-se a respeitar a capacidade máxima do espaço, zelar pela conservação das instalações e cumprir os horários acordados. O LOCADOR compromete-se a entregar o espaço limpo e em condições adequadas de uso.';
  doc.text(doc.splitTextToSize(obrig, W - 30), 15, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.text('CLÁUSULA 6ª – DO FORO', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Fica eleito o foro da comarca local para dirimir quaisquer dúvidas oriundas deste contrato.', 15, y);
  y += 18;

  doc.text(`Local e data: ____________________________, ${fmtDate(new Date().toISOString().slice(0, 10))}`, 15, y);
  y += 20;

  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;
  doc.setFontSize(9);
  doc.text('LOCADOR', 55, y, { align: 'center' });
  doc.text('LOCATÁRIO', 155, y, { align: 'center' });

  return doc.output('blob');
}
