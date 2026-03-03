import React, { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
import { numberToWords } from '@/lib/numberToWords';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import aspomLogo from '@/assets/aspom-logo.png';
import { ReceiptSettings } from '@/hooks/useReceiptSettings';

export interface ReceiptData {
  receiptNumber: string;
  receiverName: string;
  receiverDocument?: string;
  amount: number;
  reference: string;
  issueDate: Date;
  accountType?: 'payable' | 'receivable';
  companyName?: string;
  companyDocument?: string;
}

interface PrintableReceiptProps {
  receipts: ReceiptData[];
  settings?: ReceiptSettings | null;
}

interface SingleReceiptProps {
  receipt: ReceiptData;
  settings?: ReceiptSettings | null;
}

const SingleReceipt: React.FC<SingleReceiptProps> = ({ receipt, settings }) => {
  const city = settings?.city || 'Rio de Janeiro';
  const formattedDate = format(receipt.issueDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const amountInWords = numberToWords(receipt.amount);
  
  // Use custom logo or default ASPOM logo
  const logoUrl = settings?.logo_url || aspomLogo;
  const companyName = settings?.company_name;
  const companyAddress = settings?.company_address;
  const companyDocument = settings?.company_document;
  const companyPhone = settings?.company_phone;
  const companyEmail = settings?.company_email;
  const headerText = settings?.header_text;
  const footerText = settings?.footer_text;
  
  return (
    <div 
      className="receipt-container bg-white text-black border-2 border-gray-300 p-0 mb-4"
      style={{ 
        width: '190mm', 
        height: '95mm',
        pageBreakAfter: 'always',
        pageBreakInside: 'avoid'
      }}
    >
      {/* Header with Logo and Company Info */}
      <div className="flex border-b-2 border-gray-300">
        {/* Logo with black background - 4x4 cm */}
        <div 
          className="bg-black flex items-center justify-center"
          style={{ width: '40mm', height: '40mm', minWidth: '40mm' }}
        >
          <img 
            src={logoUrl || aspomLogo} 
            alt="Logo" 
            className="object-contain p-1"
            style={{ maxWidth: '38mm', maxHeight: '38mm' }}
          />
        </div>
        
        {/* Company Info next to logo */}
        <div className="flex-1 p-3 flex flex-col justify-center">
          {companyName && (
            <h1 className="text-lg font-bold">{companyName}</h1>
          )}
          {companyDocument && <p className="text-sm">{companyDocument}</p>}
          {companyAddress && <p className="text-sm">{companyAddress}</p>}
          <div className="text-xs text-gray-600 mt-1 flex gap-4">
            {companyPhone && <span>{companyPhone}</span>}
            {companyEmail && <span>{companyEmail}</span>}
          </div>
        </div>
      </div>

      {/* Header Text if provided */}
      {headerText && (
        <div className="px-4 py-2 text-center text-sm border-t border-gray-300 bg-gray-50">
          {headerText}
        </div>
      )}
      
      {/* Receipt Info Row */}
      <div className="flex border-t-2 border-gray-300">
        {/* RECIBO label */}
        <div className="w-1/3 border-r-2 border-gray-300 p-2 flex items-center justify-center">
          <span className="text-xl font-bold tracking-widest">RECIBO</span>
        </div>
        
        {/* Receipt Number */}
        <div className="w-1/3 border-r-2 border-gray-300 p-2 text-center">
          <span className="text-sm text-gray-600">Nº</span>
          <div className="text-2xl font-bold">{receipt.receiptNumber}</div>
        </div>
        
        {/* Amount */}
        <div className="w-1/3 p-2 text-center">
          <span className="text-sm text-gray-600">VALOR</span>
          <div className="text-xl font-bold">{formatCurrency(receipt.amount)}</div>
        </div>
      </div>
      
      {/* Body Content */}
      <div className="p-4 border-t-2 border-gray-300 space-y-3 text-sm">
        {/* Payable: empresa pagou fornecedor → "Recebi de [Empresa]", assinatura do fornecedor */}
        {/* Receivable: cliente pagou empresa → "Recebi de [Cliente]", assinatura da empresa */}
        {(() => {
          const isPayable = receipt.accountType === 'payable';
          // Quem paga (de quem se recebeu)
          const payerName = isPayable 
            ? (receipt.companyName || 'Empresa') 
            : (receipt.receiverName || 'Não informado');
          // Quem recebe (quem assina)
          const signerName = isPayable 
            ? (receipt.receiverName || 'Não informado') 
            : (receipt.companyName || 'Empresa');
          const signerDocument = isPayable 
            ? (receipt.receiverDocument || '_______________') 
            : (receipt.companyDocument || '_______________');
          
          return (
            <>
              <div className="flex">
                <span className="font-medium w-32">Recebi(emos) de:</span>
                <span className="flex-1 border-b border-gray-400 font-semibold">
                  {payerName}
                </span>
              </div>
              
              <div className="flex">
                <span className="font-medium w-32">A importância de:</span>
                <span className="flex-1 border-b border-gray-400">{amountInWords}</span>
              </div>
              
              <div className="flex">
                <span className="font-medium w-32">Referente à:</span>
                <span className="flex-1 border-b border-gray-400 uppercase">{receipt.reference}</span>
              </div>
              
              <div className="text-center text-gray-600 italic mt-2">
                e para maior clareza firmo(amos) o presente.
              </div>
              
              <div className="flex justify-between items-end mt-4 pt-2">
                <div className="text-sm">
                  {city}, {formattedDate}
                </div>
              </div>
              
              <div className="flex gap-8 mt-4 pt-2">
                <div className="flex-1">
                  <div className="border-t border-gray-400 pt-1 text-center">
                    <div className="text-xs text-gray-600">Assinatura:</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs">
                    <span className="font-medium">Nome:</span> {signerName}
                  </div>
                  <div className="text-xs mt-1">
                    <span className="font-medium">CPF/CNPJ:</span> {signerDocument}
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Footer Text if provided */}
        {footerText && (
          <div className="text-center text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
            {footerText}
          </div>
        )}
      </div>
    </div>
  );
};

export const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ receipts, settings }, ref) => {
    return (
      <div ref={ref} className="print-receipts bg-white p-4">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              .print-receipts {
                padding: 0 !important;
              }
              .receipt-container {
                page-break-after: always;
                page-break-inside: avoid;
                margin-bottom: 0 !important;
              }
              .receipt-container:last-child {
                page-break-after: auto;
              }
              .no-print {
                display: none !important;
              }
            }
            @media screen {
              .print-receipts {
                max-width: 210mm;
                margin: 0 auto;
              }
            }
          `}
        </style>
        
        {receipts.map((receipt, index) => (
          <SingleReceipt key={index} receipt={receipt} settings={settings} />
        ))}
      </div>
    );
  }
);

PrintableReceipt.displayName = 'PrintableReceipt';
