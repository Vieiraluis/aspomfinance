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
      {/* Header with Logo or Company Info */}
      <div className="flex">
        <div className="w-full">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-full h-auto"
              style={{ maxHeight: '35mm' }}
            />
          ) : companyName ? (
            <div className="p-4 text-center border-b border-gray-300">
              <h1 className="text-xl font-bold">{companyName}</h1>
              {companyDocument && <p className="text-sm">{companyDocument}</p>}
              {companyAddress && <p className="text-sm">{companyAddress}</p>}
              <div className="text-xs text-gray-600 mt-1 flex justify-center gap-4">
                {companyPhone && <span>{companyPhone}</span>}
                {companyEmail && <span>{companyEmail}</span>}
              </div>
            </div>
          ) : (
            <img 
              src={aspomLogo} 
              alt="ASPOM Logo" 
              className="w-full h-auto"
              style={{ maxHeight: '35mm' }}
            />
          )}
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
        <div className="flex">
          <span className="font-medium w-32">Recebi(emos) de:</span>
          <span className="flex-1 border-b border-gray-400 font-semibold">
            {companyName || 'ASPOM'}
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
              <span className="font-medium">Nome:</span> {receipt.receiverName}
            </div>
            <div className="text-xs mt-1">
              <span className="font-medium">CNPJ/CPF/RG:</span> {receipt.receiverDocument || '_______________'}
            </div>
          </div>
        </div>

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
