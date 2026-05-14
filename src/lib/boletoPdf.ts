import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import aspomLogo from '@/assets/aspom-logo.png';
import { Associado, Mensalidade } from '@/types/associados';
import { generatePixCode } from './pixCode';
import { formatCurrency } from './format';

export interface BoletoSettings {
  pix_key?: string | null;
  pix_key_type?: string | null;
  beneficiario_nome?: string | null;
  beneficiario_cidade?: string | null;
  company_name?: string | null;
  company_document?: string | null;
  company_address?: string | null;
  company_phone?: string | null;
}

interface Item {
  associado: Associado;
  mensalidade: Mensalidade;
}

const formatVencimento = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

async function drawBoleto(
  doc: jsPDF,
  yStart: number,
  item: Item,
  settings: BoletoSettings,
  logoDataUrl: string | null,
) {
  const { associado, mensalidade } = item;
  const left = 12;
  const right = 198;
  const w = right - left;

  // Header
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', left, yStart, 22, 22); } catch {}
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(settings.company_name || 'ASPOM - Associação Beneficente', left + 26, yStart + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(settings.company_document ? `CNPJ: ${settings.company_document}` : '', left + 26, yStart + 11);
  doc.text(settings.company_address || '', left + 26, yStart + 15);
  doc.text(settings.company_phone || '', left + 26, yStart + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CARNÊ DE MENSALIDADE', right, yStart + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Competência: ${mensalidade.competencia}`, right, yStart + 12, { align: 'right' });

  let y = yStart + 26;
  doc.setDrawColor(180);
  doc.line(left, y, right, y);
  y += 5;

  // Associado data
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Associado:', left, y);
  doc.setFont('helvetica', 'normal');
  doc.text(associado.nome, left + 22, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', left + 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(associado.matricula_associacao || '—', left + 142, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Posto/Grad:', left, y);
  doc.setFont('helvetica', 'normal');
  doc.text(associado.posto_graduacao || '—', left + 22, y);
  doc.setFont('helvetica', 'bold');
  doc.text('CPF:', left + 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(associado.cpf || '—', left + 142, y);

  y += 8;

  // Caixa de valor + vencimento
  doc.setDrawColor(120);
  doc.setLineWidth(0.3);
  doc.rect(left, y, w * 0.6, 20);
  doc.rect(left + w * 0.6, y, w * 0.4, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Vencimento', left + 2, y + 4);
  doc.text('Valor do Documento', left + w * 0.6 + 2, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(formatVencimento(mensalidade.vencimento), left + 4, y + 14);
  doc.text(formatCurrency(Number(mensalidade.valor)), left + w * 0.6 + 4, y + 14);

  y += 26;

  // Linha digitável (cosmético)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Linha digitável (cosmética):', left, y);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text(mensalidade.linha_digitavel || '— configure linha digitável manualmente —', left, y + 5);

  y += 12;

  // QR Code PIX
  const pixKey = settings.pix_key;
  if (pixKey && Number(mensalidade.valor) > 0) {
    const code = mensalidade.pix_payload || generatePixCode({
      pixKey,
      merchantName: settings.beneficiario_nome || settings.company_name || 'ASPOM',
      merchantCity: settings.beneficiario_cidade || 'RIO DE JANEIRO',
      amount: Number(mensalidade.valor),
      txid: mensalidade.id.replace(/-/g, '').slice(0, 25),
      description: `Mens ${mensalidade.competencia}`,
    });
    try {
      const dataUrl = await QRCode.toDataURL(code, { margin: 0, width: 220 });
      doc.addImage(dataUrl, 'PNG', left, y, 28, 28);
    } catch {}
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Pague com PIX', left + 32, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Aponte a câmera do seu app bancário ou copie e cole o código abaixo:', left + 32, y + 10);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    const lines = doc.splitTextToSize(code, w - 36);
    doc.text(lines, left + 32, y + 14);
    y += 30;
  } else {
    y += 4;
  }

  // Linha tracejada (corte)
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(160);
  doc.line(left, y + 2, right, y + 2);
  doc.setLineDashPattern([], 0);

  return y + 6;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const resp = await fetch(aspomLogo);
    const blob = await resp.blob();
    return await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateBoletosPDF(items: Item[], settings: BoletoSettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await loadLogoDataUrl();
  const pageHeight = 297;
  let y = 12;

  for (let i = 0; i < items.length; i++) {
    if (y > pageHeight - 110) {
      doc.addPage();
      y = 12;
    }
    y = await drawBoleto(doc, y, items[i], settings, logo);
    y += 4;
  }

  return doc;
}
