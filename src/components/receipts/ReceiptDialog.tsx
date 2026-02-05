import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PrintableReceipt, ReceiptData } from './PrintableReceipt';
import { useReceiptNumber } from '@/hooks/useReceiptNumber';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Printer, Loader2 } from 'lucide-react';
import { Account } from '@/types/financial';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  mode: 'single' | 'batch';
}

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  mode
}) => {
  const { user } = useAuth();
  const { generateReceiptNumber, generateMultipleReceiptNumbers, isGenerating } = useReceiptNumber();
  const { settings } = useReceiptSettings();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [customReference, setCustomReference] = useState('');
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Recibos_${new Date().toISOString().split('T')[0]}`,
  });

  const generateReceipts = async () => {
    if (!user || accounts.length === 0) return;
    
    try {
      const receiptNumbers = await generateMultipleReceiptNumbers(accounts.length);
      
      if (receiptNumbers.length !== accounts.length) {
        throw new Error('Failed to generate all receipt numbers');
      }
      
      const generatedReceipts: ReceiptData[] = accounts.map((account, index) => ({
        receiptNumber: receiptNumbers[index].receiptNumber,
        receiverName: account.supplierName || 'Não informado',
        receiverDocument: '',
        amount: account.amount,
        reference: customReference || account.description,
        issueDate: new Date()
      }));
      
      // Save receipts to database
      for (let i = 0; i < generatedReceipts.length; i++) {
        const receipt = generatedReceipts[i];
        const numberData = receiptNumbers[i];
        
        await supabase.from('receipts').insert({
          user_id: user.id,
          account_id: accounts[i].id,
          receipt_number: receipt.receiptNumber,
          year_month: numberData.yearMonth,
          sequence_number: numberData.sequenceNumber,
          receiver_name: receipt.receiverName,
          receiver_document: receipt.receiverDocument,
          amount: receipt.amount,
          amount_written: '',
          reference: receipt.reference,
          issue_date: receipt.issueDate.toISOString()
        });
      }
      
      setReceipts(generatedReceipts);
      setIsReady(true);
      
      toast({
        title: 'Recibos gerados!',
        description: `${generatedReceipts.length} recibo(s) pronto(s) para impressão.`
      });
    } catch (error) {
      console.error('Error generating receipts:', error);
      toast({
        title: 'Erro ao gerar recibos',
        description: 'Ocorreu um erro ao gerar os recibos. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    setReceipts([]);
    setIsReady(false);
    setCustomReference('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === 'batch' ? 'Impressão em Lote de Recibos' : 'Gerar Recibo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'batch' 
              ? `${accounts.length} conta(s) selecionada(s) para geração de recibos`
              : 'Gere um recibo para esta conta'
            }
          </DialogDescription>
        </DialogHeader>
        
        {!isReady ? (
          <div className="space-y-4">
            {/* Account Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Contas selecionadas:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {accounts.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.supplierName || account.description}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Referência (opcional)</Label>
              <Textarea
                id="reference"
                value={customReference}
                onChange={(e) => setCustomReference(e.target.value)}
                placeholder="Deixe em branco para usar a descrição de cada conta"
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={generateReceipts} 
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Gerar Recibos
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto bg-gray-100">
              <PrintableReceipt ref={printRef} receipts={receipts} settings={settings} />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => handlePrint()} className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimir {receipts.length > 1 ? `(${receipts.length})` : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
