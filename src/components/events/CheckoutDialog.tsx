import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EventTableRow, useCreateReservation } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { Loader2, QrCode, CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  tables: EventTableRow[];
  eventId: string;
  onSuccess: () => void;
}

export function CheckoutDialog({ open, onClose, tables, eventId, onSuccess }: Props) {
  const [clientName, setClientName] = useState('');
  const [clientDocument, setClientDocument] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [qrCode, setQrCode] = useState('');

  const createReservation = useCreateReservation();
  const total = tables.reduce((sum, t) => sum + t.price, 0);

  const handleSubmit = async () => {
    if (!clientName.trim()) return;

    const result = await createReservation.mutateAsync({
      eventId,
      clientName,
      clientDocument: clientDocument || undefined,
      clientPhone: clientPhone || undefined,
      paymentMethod,
      items: tables.map(t => ({ tableId: t.id, price: t.price })),
    });

    setQrCode((result as any)?.qr_code || '');
    setStep('success');
  };

  const handleClose = () => {
    if (step === 'success') onSuccess();
    setStep('form');
    setClientName('');
    setClientDocument('');
    setClientPhone('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === 'form' ? 'Finalizar Reserva' : 'Reserva Confirmada!'}</DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? `${tables.length} mesa(s) selecionada(s) — Total: ${formatCurrency(total)}`
              : 'A reserva foi realizada com sucesso.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input value={clientDocument} onChange={e => setClientDocument(e.target.value)} placeholder="Documento" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(21) 99999-9999" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-2">
                {[
                  { value: 'pix', label: '💠 PIX' },
                  { value: 'card', label: '💳 Cartão' },
                  { value: 'cash', label: '💵 Dinheiro' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                      paymentMethod === opt.value ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              {tables.map(t => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span>Mesa {t.table_number}</span>
                  <span>{formatCurrency(t.price)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={!clientName.trim() || createReservation.isPending} className="w-full">
              {createReservation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
              ) : (
                'Confirmar Reserva'
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <div>
              <p className="font-bold text-lg">{clientName}</p>
              <p className="text-muted-foreground">{tables.length} mesa(s) — {formatCurrency(total)}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <QrCode className="w-20 h-20 mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground font-mono">{qrCode}</p>
            </div>
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
