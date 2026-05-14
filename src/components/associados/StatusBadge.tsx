import { Badge } from '@/components/ui/badge';
import { AssociadoStatus, MensalidadeStatus, associadoStatusLabels, mensalidadeStatusLabels } from '@/types/associados';
import { cn } from '@/lib/utils';

export function AssociadoStatusBadge({ status }: { status: AssociadoStatus }) {
  const map: Record<AssociadoStatus, string> = {
    ativo: 'bg-success/15 text-success border-success/30',
    inativo: 'bg-muted text-muted-foreground border-border',
    suspenso: 'bg-warning/15 text-warning border-warning/30',
  };
  return <Badge variant="outline" className={cn(map[status])}>{associadoStatusLabels[status]}</Badge>;
}

export function MensalidadeStatusBadge({ status, vencimento }: { status: MensalidadeStatus; vencimento?: string }) {
  let effective: MensalidadeStatus = status;
  if (status === 'pendente' && vencimento) {
    const venc = new Date(vencimento + 'T23:59:59');
    if (venc < new Date()) effective = 'atrasado';
  }
  const map: Record<MensalidadeStatus, string> = {
    pago: 'bg-success/15 text-success border-success/30',
    pendente: 'bg-warning/15 text-warning border-warning/30',
    atrasado: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  return <Badge variant="outline" className={cn(map[effective])}>{mensalidadeStatusLabels[effective]}</Badge>;
}
