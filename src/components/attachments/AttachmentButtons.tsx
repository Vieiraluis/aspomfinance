import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Receipt, Paperclip, X, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AttachmentButtonsProps {
  billingSlipUrl?: string;
  paymentReceiptUrl?: string;
  onBillingSlipChange: (url: string | undefined) => void;
  onPaymentReceiptChange: (url: string | undefined) => void;
  compact?: boolean;
}

export const AttachmentButtons = ({
  billingSlipUrl,
  paymentReceiptUrl,
  onBillingSlipChange,
  onPaymentReceiptChange,
  compact = false,
}: AttachmentButtonsProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const billingInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'billing' | 'receipt'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas PDF, JPG, PNG ou WEBP são aceitos.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é de 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Convert to base64 for local storage (in production, you'd upload to a server)
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'billing') {
        onBillingSlipChange(base64);
        toast({ title: 'Boleta anexada com sucesso!' });
      } else {
        onPaymentReceiptChange(base64);
        toast({ title: 'Comprovante anexado com sucesso!' });
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    event.target.value = '';
  };

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
  };

  const removeAttachment = (type: 'billing' | 'receipt') => {
    if (type === 'billing') {
      onBillingSlipChange(undefined);
      toast({ title: 'Boleta removida' });
    } else {
      onPaymentReceiptChange(undefined);
      toast({ title: 'Comprovante removido' });
    }
  };

  return (
    <TooltipProvider>
      <div className={compact ? "flex gap-1" : "flex gap-2"}>
        {/* Billing Slip Button */}
        <input
          ref={billingInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => handleFileChange(e, 'billing')}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={billingSlipUrl ? "default" : "outline"}
              size={compact ? "icon" : "sm"}
              className={compact ? "h-8 w-8" : "gap-2"}
              onClick={() => {
                if (billingSlipUrl) {
                  openPreview(billingSlipUrl, 'Boleta de Cobrança');
                } else {
                  billingInputRef.current?.click();
                }
              }}
            >
              <FileText className="w-4 h-4" />
              {!compact && (billingSlipUrl ? 'Ver Boleta' : 'Anexar Boleta')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {billingSlipUrl ? 'Visualizar boleta de cobrança' : 'Anexar boleta de cobrança'}
          </TooltipContent>
        </Tooltip>

        {/* Payment Receipt Button */}
        <input
          ref={receiptInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => handleFileChange(e, 'receipt')}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={paymentReceiptUrl ? "default" : "outline"}
              size={compact ? "icon" : "sm"}
              className={compact ? "h-8 w-8" : "gap-2"}
              onClick={() => {
                if (paymentReceiptUrl) {
                  openPreview(paymentReceiptUrl, 'Comprovante de Pagamento');
                } else {
                  receiptInputRef.current?.click();
                }
              }}
            >
              <Receipt className="w-4 h-4" />
              {!compact && (paymentReceiptUrl ? 'Ver Comprovante' : 'Anexar Comprovante')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {paymentReceiptUrl ? 'Visualizar comprovante de pagamento' : 'Anexar comprovante de pagamento'}
          </TooltipContent>
        </Tooltip>

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <Paperclip className="w-5 h-5" />
                {previewTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {previewUrl && (
                <>
                  {previewUrl.startsWith('data:application/pdf') ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <FileText className="w-16 h-16 text-muted-foreground" />
                      <p className="text-muted-foreground">Arquivo PDF</p>
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = previewUrl;
                          link.download = `${previewTitle}.pdf`;
                          link.click();
                        }}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Baixar PDF
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt={previewTitle}
                      className="w-full max-h-[60vh] object-contain rounded-lg border"
                    />
                  )}
                  <div className="flex justify-between">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        if (previewTitle.includes('Boleta')) {
                          removeAttachment('billing');
                        } else {
                          removeAttachment('receipt');
                        }
                        setPreviewUrl(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                      Remover Anexo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        if (previewTitle.includes('Boleta')) {
                          billingInputRef.current?.click();
                        } else {
                          receiptInputRef.current?.click();
                        }
                        setPreviewUrl(null);
                      }}
                    >
                      <Paperclip className="w-4 h-4" />
                      Substituir
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
