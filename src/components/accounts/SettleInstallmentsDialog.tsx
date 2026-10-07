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
import { subMoney, sumMoney } from '@/lib/money';
import { cleanReceiptDescription, settlementTotals, validateSettlement } from '@/lib/settlement';
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
    interest: '',
    discount: '',
    split: false,
    secondAmount: '',
    secondMethod: 'cash' as Payment['paymentMethod'],
    secondBankId: '',
    paidAt: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'pix' as Payment['paymentMethod'],
    bankAccountId: '',
    notes: '',
    withReceipt: true,
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasSettled, setHasSettled] = useState(false);
  const settlementId = useRef(crypto.randomUUID());
  const [autoPrint, setAutoPrint] = useState(false);
  const principal = Number(form.amount || 0);
  const interest = Number(form.interest || 0);
  const discount = Number(form.discount || 0);
  const { net, remaining } = settlementTotals(principal, interest, discount, total);
  const secondAmount = form.split ? Number(form.secondAmount || 0) : 0;
  const firstAmount = subMoney(net, secondAmount);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Recibo_${new Date().toISOString().split('T')[0]}`,
  });

  useEffect(() => {
    if (receipt && autoPrint) {
      handlePrint();
      setAutoPrint(false);
    }
  }, [receipt, autoPrint, handlePrint]);

  useEffect(() => {
    if (open) {
      settlementId.current = crypto.randomUUID();
      setHasSettled(false);
      setAutoPrint(false);
      setReceipt(null);
      setForm((prev) => ({
        ...prev,
        amount: total.toString(),
        interest: '',
        discount: '',
        split: false,
        secondAmount: '',
        secondMethod: 'cash',
        secondBankId: activeBankAccounts[0]?.id || '',
        withReceipt: true,
        paidAt: format(new Date(), 'yyyy-MM-dd'),
        bankAccountId: activeBankAccounts[0]?.id || '',
        notes: '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = async (printImmediately = false) => {
    if (!user || accounts.length === 0 || isConfirming || hasSettled) return;
    const parts = [
      { amount: firstAmount, paymentMethod: form.paymentMethod, bankAccountId: form.bankAccountId },
      ...(form.split ? [{ amount: secondAmount, paymentMethod: form.secondMethod, bankAccountId: form.secondBankId }] : []),
    ];
    const validationError = validateSettlement(principal, interest, discount, total, parts);
    if (validationError) {
      toast({ title: 'Confira a baixa', description: validationError, variant: 'destructive' });
      return;
    }
    setIsConfirming(true);
    let completed = false;
    try {
      const [y, m, d] = form.paidAt.split('-').map(Number);
      const paidAt = new Date(y, m - 1, d, 12, 0, 0);
      if (!Number.isFinite(paidAt.getTime())) throw new Error('Informe uma data válida.');
      await settleMutation.mutateAsync({ accounts, paidAt, amount: principal, interest, discount, parts,
        notes: form.notes || undefined, settlementId: settlementId.current });
      completed = true;
      setHasSettled(true);
      toast({ title: isPayable ? 'Pagamento registrado!' : 'Recebimento registrado!',
        description: `${formatCurrency(net)} — saldo pendente ${formatCurrency(remaining)}` });
      if (form.withReceipt || printImmediately) {
        const numberData = await generateReceiptNumber();
        if (!numberData) throw new Error('Não foi possível gerar o número do recibo.');
        const first = accounts[0];
        const supplier = suppliers.find(s => s.id === first.supplierId);
        const description = [...new Set(accounts.map(a => cleanReceiptDescription(a.description)))].join('; ');
        const reference = isPayable
          ? `${description} — parcelas ${accounts.map(a => a.code || a.description).join(', ')}`
          : description;
        const { error } = await supabase.from('receipts').insert({
          user_id: user.id, account_id: first.id, receipt_number: numberData.receiptNumber,
          year_month: numberData.yearMonth, sequence_number: numberData.sequenceNumber,
          receiver_name: first.supplierName || 'Não informado', receiver_document: supplier?.document || '',
          amount: net, amount_written: '', reference, issue_date: paidAt.toISOString(),
        });
        if (error) throw error;
        setAutoPrint(printImmediately);
        setReceipt({ receiptNumber: numberData.receiptNumber, receiverName: first.supplierName || 'Não informado',
          receiverDocument: supplier?.document || '', amount: net, reference, issueDate: paidAt,
          accountType: first.type, companyName: settings?.company_name || '', companyDocument: settings?.company_document || '' });
      } else onOpenChange(false);
    } catch (error: unknown) {
      toast({ title: completed ? 'Baixa registrada; recibo não gerado' : 'Erro na baixa',
        description: error instanceof Error ? error.message : 'Não foi possível concluir.', variant: 'destructive' });
      if (completed) onOpenChange(false);
    } finally {
      if (completed) onSettled?.();
      setIsConfirming(false);
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
          <div className="space-y-3 [&_input]:h-8 [&_button[role=combobox]]:h-8 [&_label]:text-xs">
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
                <Label htmlFor="settle-amount">Valor da baixa (sem ajustes)</Label>
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="settle-interest">Juros</Label>
                <CurrencyInput id="settle-interest" value={form.interest} onValueChange={value => setForm({ ...form, interest: value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="settle-discount">Desconto</Label>
                <CurrencyInput id="settle-discount" value={form.discount} onValueChange={value => setForm({ ...form, discount: value })} />
              </div>
              <div className="space-y-1"><Label>Valor líquido</Label><p className="text-sm font-semibold text-primary">{formatCurrency(net)}</p></div>
              <div className="space-y-1"><Label>Saldo pendente</Label><p className="text-sm font-semibold">{formatCurrency(remaining)}</p></div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.split} onCheckedChange={checked => setForm({ ...form, split: checked === true })} />
              Duas formas de {isPayable ? 'pagamento' : 'recebimento'}
            </label>
            {form.split && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1"><Label>Valor da primeira forma</Label><p className="text-sm font-semibold">{formatCurrency(firstAmount)}</p></div>
                <div className="space-y-1"><Label htmlFor="settle-second-amount">Valor da segunda forma</Label>
                  <CurrencyInput id="settle-second-amount" value={form.secondAmount} onValueChange={value => setForm({ ...form, secondAmount: value })} /></div>
                <div className="space-y-1"><Label>Segunda forma</Label>
                  <Select value={form.secondMethod} onValueChange={value => setForm({ ...form, secondMethod: value as Payment['paymentMethod'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                      {Object.entries(paymentMethodLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select></div>
                <div className="space-y-1"><Label>Conta da segunda forma</Label>
                  <Select value={form.secondBankId} onValueChange={value => setForm({ ...form, secondBankId: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
                      {activeBankAccounts.map(ba => <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>)}
                    </SelectContent>
                  </Select></div>
              </div>
            )}

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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={() => handleConfirm(true)} disabled={isConfirming || hasSettled} className="gap-2">
                <Printer className="h-4 w-4" /> Confirmar e imprimir
              </Button>
              <Button onClick={() => handleConfirm()} disabled={isConfirming || hasSettled}>
                {isConfirming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar {isPayable ? 'pagamento' : 'recebimento'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 [&_input]:h-8 [&_button[role=combobox]]:h-8 [&_label]:text-xs">
            <div className="border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto bg-muted">
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
