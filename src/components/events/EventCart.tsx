import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventTableRow } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AREA_LABEL: Record<string, string> = {
  vip: 'VIP',
  premium: 'Premium',
  standard: 'Padrão',
  economy: 'Econômica',
};

interface Props {
  selectedTables: EventTableRow[];
  onRemove: (tableId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function EventCart({ selectedTables, onRemove, onClear, onCheckout }: Props) {
  const total = selectedTables.reduce((sum, t) => sum + t.price, 0);

  if (selectedTables.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Selecione mesas no mapa para adicionar ao carrinho</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Carrinho ({selectedTables.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedTables.map(table => (
          <div key={table.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
            <div>
              <span className="font-medium">Mesa {table.table_number}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {AREA_LABEL[table.area]}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{formatCurrency(table.price)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(table.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}

        <div className="border-t border-border pt-3 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClear} className="flex-1">
            Limpar
          </Button>
          <Button size="sm" onClick={onCheckout} className="flex-1">
            <CreditCard className="w-4 h-4 mr-2" />
            Finalizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
