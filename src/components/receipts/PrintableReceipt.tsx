import React, { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
import { numberToWords } from '@/lib/numberToWords';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import aspomLogo from '@/assets/aspom-logo.png';

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
}

const SingleReceipt: React.FC<{ receipt: ReceiptData }> = ({ receipt }) => {
  const formattedDate = format(receipt.issueDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const amountInWords = numberToWords(receipt.amount);
  
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
      {/* Header with Logo */}
      <div className="flex">
        <div className="w-full">
          <img 
            src={aspomLogo} 
            alt="ASPOM Logo" 
            className="w-full h-auto"
            style={{ maxHeight: '45mm' }}
          />
        </div>
      </div>
      
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
          <span className="flex-1 border-b border-gray-400 font-semibold">ASPOM</span>
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
            Rio de Janeiro, {formattedDate}
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
      </div>
    </div>
  );
};

export const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ receipts }, ref) => {
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
          <SingleReceipt key={index} receipt={receipt} />
        ))}
      </div>
    );
  }
);

PrintableReceipt.displayName = 'PrintableReceipt';
