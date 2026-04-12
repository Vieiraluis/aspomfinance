import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventTableRow, useBulkUpdateTablePrice, useUpdateTableSeatsCount } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { DollarSign, Save, Users } from 'lucide-react';

interface Props {
  tables: EventTableRow[];
  eventId: string;
}

const AREA_LABELS: Record<string, string> = {
  vip: 'VIP',
  premium: 'Premium',
  standard: 'Padrão',
  economy: 'Econômica',
};

export function BulkPriceEditor({ tables, eventId }: Props) {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [newPrice, setNewPrice] = useState('');
  const [newSeats, setNewSeats] = useState('');
  const bulkUpdate = useBulkUpdateTablePrice();
  const updateSeats = useUpdateTableSeatsCount();

  const areas = useMemo(() => {
    const set = new Set(tables.map(t => t.area));
    return Array.from(set);
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (selectedArea === 'all') return tables.filter(t => t.status === 'available');
    return tables.filter(t => t.area === selectedArea && t.status === 'available');
  }, [tables, selectedArea]);

  const handleBulkPrice = () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0 || filteredTables.length === 0) return;
    bulkUpdate.mutate({
      tableIds: filteredTables.map(t => t.id),
      price,
      eventId,
    });
    setNewPrice('');
  };

  const handleBulkSeats = async () => {
    const seats = parseInt(newSeats);
    if (isNaN(seats) || seats < 1 || filteredTables.length === 0) return;
    for (const table of filteredTables) {
      await updateSeats.mutateAsync({ tableId: table.id, seatsCount: seats, eventId });
    }
    setNewSeats('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Edição em Massa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Filtrar por Área</Label>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ({tables.filter(t => t.status === 'available').length} mesas)</SelectItem>
              {areas.map(area => (
                <SelectItem key={area} value={area}>
                  {AREA_LABELS[area] || area} ({tables.filter(t => t.area === area && t.status === 'available').length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Novo Preço ({filteredTables.length} mesas)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="R$ 0,00"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              className="h-8"
              min={0}
              step={10}
            />
            <Button size="sm" className="h-8 shrink-0" onClick={handleBulkPrice} disabled={bulkUpdate.isPending || !newPrice}>
              <Save className="w-3 h-3 mr-1" />
              Aplicar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Assentos por Mesa ({filteredTables.length} mesas)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="10"
              value={newSeats}
              onChange={e => setNewSeats(e.target.value)}
              className="h-8"
              min={1}
              max={20}
            />
            <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={handleBulkSeats} disabled={updateSeats.isPending || !newSeats}>
              <Users className="w-3 h-3 mr-1" />
              Aplicar
            </Button>
          </div>
        </div>

        {/* Current prices summary */}
        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Preços atuais por área:</p>
          {areas.map(area => {
            const areaTables = tables.filter(t => t.area === area);
            const prices = [...new Set(areaTables.map(t => t.price))];
            return (
              <div key={area} className="flex justify-between text-xs">
                <span>{AREA_LABELS[area] || area}</span>
                <span className="text-primary font-medium">
                  {prices.length === 1 ? formatCurrency(prices[0]) : prices.map(p => formatCurrency(p)).join(', ')}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
