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
import { FileText, Receipt, Paperclip, X, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const billingInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'billing' | 'receipt'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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

    setIsUploading(true);
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get permanent public URL
      const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path);

      if (type === 'billing') {
        onBillingSlipChange(publicUrlData.publicUrl);
        toast({ title: 'Boleta anexada com sucesso!' });
      } else {
        onPaymentReceiptChange(signedUrlData.signedUrl);
        toast({ title: 'Comprovante anexado com sucesso!' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
  };

  const removeAttachment = async (type: 'billing' | 'receipt') => {
    // Note: We could delete from storage here, but for simplicity we just remove the reference
    // The file will remain in storage (orphaned), which can be cleaned up periodically
    if (type === 'billing') {
      onBillingSlipChange(undefined);
      toast({ title: 'Boleta removida' });
    } else {
      onPaymentReceiptChange(undefined);
      toast({ title: 'Comprovante removido' });
    }
  };

  const isPdf = (url: string) => {
    return url.includes('.pdf') || url.startsWith('data:application/pdf');
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
          disabled={isUploading}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={billingSlipUrl ? "default" : "outline"}
              size={compact ? "icon" : "sm"}
              className={compact ? "h-8 w-8" : "gap-2"}
              disabled={isUploading}
              onClick={() => {
                if (billingSlipUrl) {
                  openPreview(billingSlipUrl, 'Boleta de Cobrança');
                } else {
                  billingInputRef.current?.click();
                }
              }}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
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
          disabled={isUploading}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={paymentReceiptUrl ? "default" : "outline"}
              size={compact ? "icon" : "sm"}
              className={compact ? "h-8 w-8" : "gap-2"}
              disabled={isUploading}
              onClick={() => {
                if (paymentReceiptUrl) {
                  openPreview(paymentReceiptUrl, 'Comprovante de Pagamento');
                } else {
                  receiptInputRef.current?.click();
                }
              }}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
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
                  {isPdf(previewUrl) ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <FileText className="w-16 h-16 text-muted-foreground" />
                      <p className="text-muted-foreground">Arquivo PDF</p>
                      <Button
                        onClick={() => window.open(previewUrl, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir PDF
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
