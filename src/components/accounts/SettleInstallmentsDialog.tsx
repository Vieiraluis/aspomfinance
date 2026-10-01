import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Account, Payment, paymentMethodLabels } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/format';
import { sumMoney } from '@/lib/money';
import { useBankAccounts, useSuppliers } from '@/hooks/useSupabaseData';
import { useSettleInstallments } from '@/hooks/useAccountEntries';
import { useReceiptNumber } from '@/hooks/useReceiptNumber';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PrintableReceipt, ReceiptData } from '@/components/receipts/PrintableReceipt';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, Printer, Wallet } from 'lucide-react';

interface SettleInstallmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  headId?: string;
  onSettled?: () => void;
}

export const SettleInstallmentsDialog = ({
  open,
  onOpenChange,
  accounts,
  headId,
  onSettled,
}: SettleInstallmentsDialogProps) => {
  const { user } = useAuth();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: suppliers = [] } = useSuppliers();
  const { settings } = useReceiptSettings();
  const { generateReceiptNumber } = useReceiptNumber();
  const settleMutation = useSettleInstallments();
  const printRef = useRef<HTMLDivElement>(null);

  const activeBankAccounts = bankAccounts.filter((ba) => ba.isActive);
  const total = sumMoney(accounts, (a) => a.amount);
  const isPayable = accounts[0]?.type === 'payable';

  const [form, setForm] = useState({
    amount: '',
    paidAt: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'pix' as Payment['paymentMethod'],
    bankAccountId: '',
    notes: '',
    withReceipt: true,
  });
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Recibo_${new Date().toISOString().split('T')[0]}`,
  });

  useEffect(() => {
    if (open) {
      setReceipt(null);
      setForm((prev) => ({
        ...prev,
        amount: total.toString(),
        paidAt: format(new Date(), 'yyyy-MM-dd'),
        bankAccountId: activeBankAccounts[0]?.id || '',
        notes: '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, total, bankAccounts.length]);

  const handleConfirm = async () => {
    if (!user || accounts.length === 0) return;
    if (!form.bankAccountId) {
      toast({
        title: 'Selecione uma conta',
        description: 'Escolha a conta bancária da quitação.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(form.amount || '0');
    if (!amount || amount <= 0) {
      toast({ title: 'Informe o valor da quitação', variant: 'destructive' });
      return;
    }

    try {
      const [y, m, d] = form.paidAt.split('-').map(Number);
      const paidAt = new Date(y, m - 1, d, 12, 0, 0);

      await settleMutation.mutateAsync({
        accounts,
        paidAt,
        paymentMethod: form.paymentMethod,
        bankAccountId: form.bankAccountId,
        notes: form.notes || undefined,
        amount,
        headId,
      });

      toast({
        title: isPayable ? 'Pagamento registrado!' : 'Recebimento registrado!',
        description: `${accounts.length} parcela(s) — ${formatCurrency(amount)}`,
      });

      if (form.withReceipt) {
        const numberData = await generateReceiptNumber();
        if (numberData) {
          const supplier = accounts[0].supplierId
            ? suppliers.find((s) => s.id === accounts[0].supplierId)
            : undefined;
          const reference = `${accounts[0].description.replace(/\s*\(\d+\/\d+\)$/, '')} — parcelas ${accounts
            .map((a) => a.code || a.description)
            .join(', ')}`;

          await supabase.from('receipts').insert({
            user_id: user.id,
            account_id: accounts[0].id,
            receipt_number: numberData.receiptNumber,
            year_month: numberData.yearMonth,
            sequence_number: numberData.sequenceNumber,
            receiver_name: accounts[0].supplierName || 'Não informado',
            receiver_document: supplier?.document || '',
            amount,
            amount_written: '',
            reference,
            issue_date: paidAt.toISOString(),
          });

          setReceipt({
            receiptNumber: numberData.receiptNumber,
            receiverName: accounts[0].supplierName || 'Não informado',
            receiverDocument: supplier?.document || '',
            amount,
            reference,
            issueDate: paidAt,
            accountType: accounts[0].type,
            companyName: settings?.company_name || '',
            companyDocument: settings?.company_document || '',
          });
        }
      }

      onSettled?.();
      if (!form.withReceipt) onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível concluir a quitação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[920px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isPayable ? 'Quitar parcelas' : 'Receber parcelas'}
          </DialogTitle>
          <DialogDescription>
            {accounts.length} parcela(s) selecionada(s) — total {formatCurrency(total)}
          </DialogDescription>
        </DialogHeader>

        {!receipt ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1 max-h-40 overflow-y-auto">
              {accounts.map((a) => (
                <div key={a.id} className="flex justify-between text-sm">
                  <span className="truncate">
                    <span className="font-mono text-xs text-muted-foreground mr-2">{a.code}</span>
                    {a.description} — venc. {formatDate(a.dueDate)}
                  </span>
                  <span className="font-medium whitespace-nowrap">{formatCurrency(a.amount)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="settle-amount">Valor da quitação</Label>
                <CurrencyInput
                  id="settle-amount"
                  value={form.amount}
                  onValueChange={(value) => setForm({ ...form, amount: value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settle-date">Data</Label>
                <Input
                  id="settle-date"
                  type="date"
                  value={form.paidAt}
                  onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Conta bancária</Label>
                <Select
                  value={form.bankAccountId}
                  onValueChange={(value) => setForm({ ...form, bankAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBankAccounts.map((ba) => (
                      <SelectItem key={ba.id} value={ba.id}>
                        <span className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          {ba.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de quitação</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(value) =>
                    setForm({ ...form, paymentMethod: value as Payment['paymentMethod'] })
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
              <Label htmlFor="settle-notes">Observações</Label>
              <Input
                id="settle-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas da quitação..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.withReceipt}
                onCheckedChange={(checked) => setForm({ ...form, withReceipt: !!checked })}
              />
              Gerar recibo único consolidado
            </label>

            <p className="text-xs text-muted-foreground">
              Se o valor informado for menor que o total selecionado, o sistema gera
              automaticamente uma nova parcela com o saldo restante.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={settleMutation.isPending}>
                {settleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar quitação
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto bg-gray-100">
              <PrintableReceipt ref={printRef} receipts={[receipt]} settings={settings} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => handlePrint()} className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimir recibo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
