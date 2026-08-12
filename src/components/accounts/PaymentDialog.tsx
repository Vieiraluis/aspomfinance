import { useEffect, useState } from 'react';
import { Account, paymentMethodLabels, Payment } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Wallet, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useBankAccounts, useProcessPayment } from '@/hooks/useSupabaseData';

interface PaymentDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentDialog = ({ account, open, onOpenChange }: PaymentDialogProps) => {
  const { data: bankAccounts = [] } = useBankAccounts();
  const processPaymentMutation = useProcessPayment();
  const activeBankAccounts = bankAccounts.filter((ba) => ba.isActive);

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'pix' as Payment['paymentMethod'],
    paidAt: format(new Date(), 'yyyy-MM-dd'),
    bankAccountId: '',
    notes: '',
  });

  useEffect(() => {
    if (open && account) {
      setPaymentData({
        amount: account.amount.toString(),
        paymentMethod: 'pix',
        paidAt: format(new Date(), 'yyyy-MM-dd'),
        bankAccountId: activeBankAccounts[0]?.id || '',
        notes: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account?.id, bankAccounts.length]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (!paymentData.bankAccountId) {
      toast({
        title: 'Selecione uma conta',
        description: 'É necessário selecionar uma conta bancária para a baixa.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const [year, month, day] = paymentData.paidAt.split('-').map(Number);
      const paidAt = new Date(year, month - 1, day, 12, 0, 0);

      await processPaymentMutation.mutateAsync({
        accountId: account.id,
        payment: {
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          paidAt,
          bankAccountId: paymentData.bankAccountId,
          notes: paymentData.notes || undefined,
        },
      });

      const bankAccount = bankAccounts.find((ba) => ba.id === paymentData.bankAccountId);

      toast({
        title: account.type === 'payable' ? 'Pagamento registrado!' : 'Recebimento registrado!',
        description: `${account.description} - ${formatCurrency(parseFloat(paymentData.amount))} via ${bankAccount?.name}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[520px] max-h-[85vh] overflow-y-auto p-4 sm:p-5">
        <DialogHeader className="pb-1">
          <DialogTitle className="font-display text-lg">
            {account?.type === 'payable' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
          </DialogTitle>
        </DialogHeader>
        {account && (
          <form onSubmit={handlePayment} className="space-y-3">
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="min-w-0">
                {account.code && (
                  <p className="text-[11px] font-mono text-muted-foreground">{account.code}</p>
                )}
                <p className="font-medium text-sm truncate">{account.description}</p>
              </div>
              <p
                className={cn(
                  'text-base font-semibold whitespace-nowrap',
                  account.type === 'payable' ? 'text-destructive' : 'text-success',
                )}
              >
                {formatCurrency(account.amount)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Valor {account.type === 'payable' ? 'Pago' : 'Recebido'}</Label>
                <CurrencyInput
                  id="amount"
                  value={paymentData.amount}
                  onValueChange={(value) => setPaymentData({ ...paymentData, amount: value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paidAt">Data</Label>
                <Input
                  id="paidAt"
                  type="date"
                  value={paymentData.paidAt}
                  onChange={(e) => setPaymentData({ ...paymentData, paidAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankAccountId">Conta para Baixa</Label>
                <Select
                  value={paymentData.bankAccountId}
                  onValueChange={(value) => setPaymentData({ ...paymentData, bankAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBankAccounts.map((ba) => (
                      <SelectItem key={ba.id} value={ba.id}>
                        <span className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          {ba.name} ({formatCurrency(ba.currentBalance)})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeBankAccounts.length === 0 && (
                  <p className="text-xs text-destructive">
                    Nenhuma conta bancária ativa. Cadastre uma conta primeiro.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value) =>
                    setPaymentData({ ...paymentData, paymentMethod: value as Payment['paymentMethod'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Notas adicionais..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={processPaymentMutation.isPending}>
                {processPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar {account.type === 'payable' ? 'Pagamento' : 'Recebimento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
