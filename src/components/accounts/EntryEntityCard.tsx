import { Supplier } from '@/types/financial';
import { Building2, UserRound } from 'lucide-react';

interface Props {
  entity: Supplier;
  label: string;
}

export function EntryEntityCard({ entity, label }: Props) {
  const Icon = entity.type === 'supplier' ? Building2 : UserRound;
  const details = [
    ['CPF / CNPJ', entity.document],
    ['Telefone', entity.phone],
    ['E-mail', entity.email],
    ['Endereço', entity.address],
  ];

  return (
    <section aria-label={`Dados do ${label.toLowerCase()}`} className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="mb-1.5 flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 break-words text-sm font-semibold text-foreground">{entity.name}</h2>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{label}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {details.map(([name, value]) => (
          <div key={name} className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">{name}</dt>
            <dd className="break-words text-xs text-foreground">{value || 'Não informado'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}