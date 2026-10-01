import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';
import { CategorySelectOptions } from '@/components/accounts/CategorySelectOptions';
import { AttachmentButtons } from '@/components/attachments/AttachmentButtons';
import { SettleInstallmentsDialog } from '@/components/accounts/SettleInstallmentsDialog';
import { Account, AccountCategory } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/format';
import { sumMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { format, addMonths } from 'date-fns';
import {
  useAccountEntry,
  useSaveAccountEntry,
  splitInstallments,
  EntryInstallmentInput,
} from '@/hooks/useAccountEntries';
import { useDeleteAccount, useUpdateAccount, useSuppliers } from '@/hooks/useSupabaseData';
import {
  ArrowLeft,
  BadgeCheck,
  FilePlus2,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react';

interface Props {
  type: 'payable' | 'receivable';
}

const termOptions = [
  { value: '1', label: 'À vista' },
  ...Array.from({ length: 23 }, (_, i) => ({
    value: String(i + 2),
    label: `Parcelado ${i + 2}x`,
  })),
];

const emptyHeader = {
  supplierId: '',
  documentNumber: '',
  description: '',
  category: 'other' as AccountCategory,
  totalAmount: '',
  firstDueDate: format(new Date(), 'yyyy-MM-dd'),
  terms: '1',
  notes: '',
};

export const AccountEntryScreen = ({ type }: Props) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: entry, isLoading } = useAccountEntry(id);
  const { data: suppliers = [] } = useSuppliers();
  const saveMutation = useSaveAccountEntry();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();

  const isPayable = type === 'payable';
  const basePath = isPayable ? '/payables' : '/receivables';
  const entityLabel = isPayable ? 'Fornecedor' : 'Cliente';

  const [header, setHeader] = useState(emptyHeader);
  const [rows, setRows] = useState<EntryInstallmentInput[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(!id);
  const [isSettleOpen, setIsSettleOpen] = useState(false);

  const saved = entry?.installments ?? [];

  // Carrega dados do lançamento salvo
  useEffect(() => {
    if (!entry) return;
    const head = entry.head;
    const baseDescription = head.description.replace(/\s*\(\d+\/\d+\)$/, '');
    setHeader({
      supplierId: head.supplierId || '',
      documentNumber: head.documentNumber || '',
      description: baseDescription,
      category: (head.category as AccountCategory) || 'other',
      totalAmount: sumMoney(entry.installments, (a) => a.amount).toString(),
      firstDueDate: format(head.dueDate, 'yyyy-MM-dd'),
      terms: head.paymentTerms || String(entry.installments.length),
      notes: head.notes || '',
    });
    setIsEditing(false);
  }, [entry]);

  // Gera o desmembramento das parcelas (apenas em novo lançamento)
  useEffect(() => {
    if (id) return;
    const count = parseInt(header.terms) || 1;
    const total = parseFloat(header.totalAmount || '0');
    if (!total) {
      setRows([]);
      return;
    }
    const [y, m, d] = header.firstDueDate.split('-').map(Number);
    const first = new Date(y, m - 1, d, 12, 0, 0);
    const values = splitInstallments(total, count);
    setRows(
      values.map((amount, index) => ({
        installmentNumber: index + 1,
        amount,
        dueDate: addMonths(first, index),
      })),
    );
  }, [id, header.terms, header.totalAmount, header.firstDueDate]);

  const pendingSelected = useMemo(
    () => saved.filter((a) => selected.includes(a.id) && a.status !== 'paid'),
    [saved, selected],
  );

  const totalSaved = sumMoney(saved, (a) => a.amount);

  const resetToNew = () => {
    setHeader(emptyHeader);
    setRows([]);
    setSelected([]);
    setIsEditing(true);
    navigate(`${basePath}/lancamento`);
  };

  const handleSave = async () => {
    if (!header.description.trim()) {
      toast({ title: 'Informe a descrição do lançamento', variant: 'destructive' });
      return;
    }
    const total = parseFloat(header.totalAmount || '0');
    if (!total) {
      toast({ title: 'Informe o valor total', variant: 'destructive' });
      return;
    }

    const supplier = suppliers.find((s) => s.id === header.supplierId);

    try {
      if (id && entry) {
        // Atualiza apenas o cabeçalho das parcelas existentes
        for (const inst of entry.installments) {
          await updateAccountMutation.mutateAsync({
            id: inst.id,
            documentNumber: header.documentNumber || undefined,
            supplierId: header.supplierId || undefined,
            supplierName: supplier?.name || undefined,
            category: header.category,
            notes: header.notes || undefined,
          });
        }
        toast({ title: 'Lançamento atualizado!' });
        setIsEditing(false);
        return;
      }

      const headId = await saveMutation.mutateAsync({
        type,
        description: header.description,
        documentNumber: header.documentNumber || undefined,
        paymentTerms: header.terms,
        supplierId: header.supplierId || undefined,
        supplierName: supplier?.name,
        category: header.category,
        notes: header.notes || undefined,
        installments: rows,
      });

      toast({ title: 'Lançamento registrado!' });
      navigate(`${basePath}/lancamento/${headId}`);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteAccountMutation.mutateAsync(id);
      toast({ title: 'Lançamento excluído!' });
      navigate(basePath);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir.',
        variant: 'destructive',
      });
    }
  };

  const openSettle = () => {
    if (pendingSelected.length === 0) {
      toast({
        title: 'Selecione as parcelas',
        description: 'Marque ao menos uma parcela em aberto para quitar.',
        variant: 'destructive',
      });
      return;
    }
    setIsSettleOpen(true);
  };

  const toggleRow = (accountId: string) =>
    setSelected((prev) =>
      prev.includes(accountId) ? prev.filter((r) => r !== accountId) : [...prev, accountId],
    );

  const toolbar: {
    icon: typeof Save;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'destructive';
  }[] = [
    { icon: FilePlus2, label: 'Novo', onClick: resetToNew, variant: 'outline' },
    {
      icon: Save,
      label: 'Salvar',
      onClick: handleSave,
      disabled: (!!id && !isEditing) || saveMutation.isPending,
    },
    {
      icon: Pencil,
      label: 'Editar',
      onClick: () => setIsEditing(true),
      disabled: !id || isEditing,
      variant: 'outline',
    },
    {
      icon: X,
      label: 'Cancelar',
      onClick: () => (id ? setIsEditing(false) : navigate(basePath)),
      variant: 'outline',
    },
    {
      icon: BadgeCheck,
      label: isPayable ? 'Quitar' : 'Receber',
      onClick: openSettle,
      disabled: !id,
      variant: 'outline',
    },
    {
      icon: Trash2,
      label: 'Excluir',
      onClick: handleDelete,
      disabled: !id,
      variant: 'destructive',
    },
  ];

  const displayRows: {
    key: string;
    account?: Account;
    number: string;
    dueDate: Date;
    amount: number;
    status: string;
  }[] = id
    ? saved.map((a, index) => ({
        key: a.id,
        account: a,
        number: a.installmentNumber
          ? `${a.installmentNumber}/${a.totalInstallments ?? saved.length}`
          : `${index + 1}/${saved.length}`,
        dueDate: a.dueDate,
        amount: a.amount,
        status: a.status === 'paid' ? 'Pago' : 'Pendente',
      }))
    : rows.map((r) => ({
        key: `new-${r.installmentNumber}`,
        number: `${r.installmentNumber}/${rows.length}`,
        dueDate: r.dueDate,
        amount: r.amount,
        status: 'Pendente',
      }));

  const readOnly = !!id && !isEditing;

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(basePath)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {isPayable ? 'Lançamento — Contas a Pagar' : 'Lançamento — Contas a Receber'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Cabeçalho do título e desmembramento das parcelas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {toolbar.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant={item.variant ?? 'default'}
                      disabled={item.disabled}
                      onClick={item.onClick}
                      aria-label={item.label}
                    >
                      <item.icon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Cabeçalho */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Identificador</Label>
                <Input
                  value={entry?.head.code || 'Gerado automaticamente'}
                  readOnly
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>{entityLabel}</Label>
                <SupplierSelect
                  value={header.supplierId}
                  onValueChange={(value) => setHeader({ ...header, supplierId: value })}
                  type={isPayable ? 'supplier' : 'receiver'}
                  placeholder={`Selecione o ${entityLabel.toLowerCase()}...`}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-number">Número do documento / NF</Label>
                <Input
                  id="doc-number"
                  value={header.documentNumber}
                  onChange={(e) => setHeader({ ...header, documentNumber: e.target.value })}
                  placeholder="Ex: NF 12345"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-description">Descrição</Label>
                <Input
                  id="entry-description"
                  value={header.description}
                  onChange={(e) => setHeader({ ...header, description: e.target.value })}
                  placeholder="Ex: Compra de equipamentos"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-amount">Valor total</Label>
                <CurrencyInput
                  id="entry-amount"
                  value={header.totalAmount}
                  onValueChange={(value) => setHeader({ ...header, totalAmount: value })}
                  readOnly={!!id}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {isPayable ? 'Condição de pagamento' : 'Condição de recebimento'}
                </Label>
                <Select
                  value={header.terms}
                  onValueChange={(value) => setHeader({ ...header, terms: value })}
                  disabled={!!id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-due">Primeiro vencimento</Label>
                <Input
                  id="entry-due"
                  type="date"
                  value={header.firstDueDate}
                  onChange={(e) => setHeader({ ...header, firstDueDate: e.target.value })}
                  readOnly={!!id}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={header.category}
                  onValueChange={(value) =>
                    setHeader({ ...header, category: value as AccountCategory })
                  }
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <CategorySelectOptions />
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-notes">Observações</Label>
              <Textarea
                id="entry-notes"
                value={header.notes}
                onChange={(e) => setHeader({ ...header, notes: e.target.value })}
                rows={2}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Subformulário de parcelas */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
              <h2 className="font-display font-semibold">Parcelas</h2>
              <div className="text-sm text-muted-foreground">
                {id ? (
                  <>Total do lançamento: <strong>{formatCurrency(totalSaved)}</strong></>
                ) : (
                  <>Total: <strong>{formatCurrency(sumMoney(rows, (r) => r.amount))}</strong></>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Anexos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Informe o valor total e a condição para gerar as parcelas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayRows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>
                          {row.account && row.account.status !== 'paid' && (
                            <Checkbox
                              checked={selected.includes(row.account.id)}
                              onCheckedChange={() => toggleRow(row.account!.id)}
                              aria-label={`Selecionar parcela ${row.number}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.number}
                          {row.account?.code && (
                            <span className="ml-2 text-xs font-mono text-muted-foreground">
                              {row.account.code}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(row.dueDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              row.status === 'Pago'
                                ? 'bg-success/20 text-success border-success/30'
                                : 'bg-warning/20 text-warning border-warning/30',
                            )}
                          >
                            {row.status === 'Pago' && !isPayable ? 'Recebido' : row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {row.account && (
                              <AttachmentButtons
                                compact
                                billingSlipUrl={row.account.billingSlipUrl}
                                paymentReceiptUrl={row.account.paymentReceiptUrl}
                                onBillingSlipChange={(url) =>
                                  updateAccountMutation.mutate({
                                    id: row.account!.id,
                                    billingSlipUrl: url,
                                  })
                                }
                                onPaymentReceiptChange={(url) =>
                                  updateAccountMutation.mutate({
                                    id: row.account!.id,
                                    paymentReceiptUrl: url,
                                  })
                                }
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </TooltipProvider>

      <SettleInstallmentsDialog
        open={isSettleOpen}
        onOpenChange={setIsSettleOpen}
        accounts={pendingSelected}
        headId={id}
        onSettled={() => setSelected([])}
      />
    </MainLayout>
  );
};
