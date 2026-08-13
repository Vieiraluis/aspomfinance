import { useState } from 'react';
import { Account } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { AttachmentButtons } from '@/components/attachments/AttachmentButtons';
import { PaymentDialog } from '@/components/accounts/PaymentDialog';
import { useUpdateAccount } from '@/hooks/useSupabaseData';
import { toast } from '@/hooks/use-toast';
import { printAttachment } from '@/lib/printAttachment';
import { CheckCircle2, Pencil, Printer, Receipt, Trash2 } from 'lucide-react';


interface AccountRowActionsProps {
  account: Account;
  onEdit: (account: Account) => void;
  onReceipt: (account: Account) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

/**
 * Painel unificado de ações de um lançamento — mesmas ações da tela de
 * Baixa/Conciliação: baixa, edição, anexos (boleto/comprovante), recibo e exclusão.
 */
export const AccountRowActions = ({
  account,
  onEdit,
  onReceipt,
  onDelete,
  isDeleting,
}: AccountRowActionsProps) => {
  const updateAccountMutation = useUpdateAccount();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const isPending = account.status === 'pending' || account.status === 'overdue';

  const handleUpdate = async (data: Partial<Account>) => {
    try {
      await updateAccountMutation.mutateAsync({ id: account.id, ...data });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      {isPending && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsPaymentOpen(true)}
          title={account.type === 'payable' ? 'Dar baixa (pagar)' : 'Dar baixa (receber)'}
        >
          <CheckCircle2 className="w-4 h-4 text-success" />
        </Button>
      )}

      <AttachmentButtons
        billingSlipUrl={account.billingSlipUrl}
        paymentReceiptUrl={account.paymentReceiptUrl}
        onBillingSlipChange={(url) => handleUpdate({ billingSlipUrl: url })}
        onPaymentReceiptChange={(url) => handleUpdate({ paymentReceiptUrl: url })}
        compact
      />

      {account.billingSlipUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => printAttachment(account.billingSlipUrl, 'Boleto')}
          title="Imprimir boleto anexado"
        >
          <Printer className="w-4 h-4 text-muted-foreground" />
        </Button>
      )}

      {account.paymentReceiptUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => printAttachment(account.paymentReceiptUrl, 'Comprovante de Pagamento')}
          title="Imprimir comprovante de pagamento"
        >
          <Printer className="w-4 h-4 text-success" />
        </Button>
      )}


      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(account)}
        title="Editar lançamento"
      >
        <Pencil className="w-4 h-4 text-primary" />
      </Button>

      {account.status === 'paid' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onReceipt(account)}
          title="Gerar recibo"
        >
          <Receipt className="w-4 h-4 text-primary" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onDelete(account.id)}
        disabled={isDeleting}
        title="Excluir lançamento"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>

      <PaymentDialog account={account} open={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
    </div>
  );
};
