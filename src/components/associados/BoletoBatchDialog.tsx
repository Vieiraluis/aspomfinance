import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Printer } from 'lucide-react';
import { Associado, Mensalidade } from '@/types/associados';
import { generateBoletosPDF, BoletoSettings } from '@/lib/boletoPdf';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mensalidades: Mensalidade[];
  associados: Associado[];
}

export function BoletoBatchDialog({ open, onOpenChange, mensalidades, associados }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === mensalidades.length) setSelected(new Set());
    else setSelected(new Set(mensalidades.map((m) => m.id)));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: settings } = await supabase.from('receipt_settings').select('*').maybeSingle();
      const items = mensalidades
        .filter((m) => selected.has(m.id))
        .map((m) => ({ mensalidade: m, associado: associados.find((a) => a.id === m.associado_id)! }))
        .filter((i) => i.associado);
      if (items.length === 0) {
        toast({ title: 'Selecione ao menos uma mensalidade', variant: 'destructive' });
        return;
      }
      const doc = await generateBoletosPDF(items, (settings || {}) as BoletoSettings);
      doc.save(`boletos-aspom-${Date.now()}.pdf`);
      toast({ title: `${items.length} boleto(s) gerado(s)` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="font-display">Imprimir Boletos em Lote</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{mensalidades.length} mensalidade(s) disponíveis · {selected.size} selecionada(s)</span>
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            {selected.size === mensalidades.length ? 'Limpar' : 'Selecionar tudo'}
          </Button>
        </div>
        <ScrollArea className="h-80 border border-border rounded-md">
          <div className="divide-y divide-border">
            {mensalidades.map((m) => {
              const a = associados.find((x) => x.id === m.associado_id);
              return (
                <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a?.nome || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.competencia} · Venc. {m.vencimento.split('-').reverse().join('/')} · {formatCurrency(Number(m.valor))}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={generating || selected.size === 0}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            Gerar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
