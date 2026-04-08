import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { EventTableRow, EventSeatRow } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { TableDetailModal } from './TableDetailModal';

interface TableMapASPOMProps {
  tables: EventTableRow[];
  seats: EventSeatRow[];
  eventId: string;
  selectedTables: string[];
  onToggleTable: (tableId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 shadow-emerald-500/30',
  reserved: 'bg-red-500 hover:bg-red-400 border-red-400 shadow-red-500/30',
  blocked: 'bg-muted-foreground/40 border-muted-foreground/30',
};

const AREA_LABELS: Record<string, string> = {
  vip: 'VIP',
  premium: 'Premium',
  standard: 'Padrão',
  economy: 'Econômica',
};

const AREA_BADGE: Record<string, string> = {
  vip: 'text-amber-400',
  premium: 'text-purple-400',
  standard: 'text-blue-400',
  economy: 'text-muted-foreground',
};

export function TableMapASPOM({ tables, seats, eventId, selectedTables, onToggleTable }: TableMapASPOMProps) {
  const [detailTable, setDetailTable] = useState<EventTableRow | null>(null);

  // Group tables by sections matching ASPOM layout
  const sections = useMemo(() => {
    const byNumber = new Map(tables.map(t => [t.table_number, t]));

    // Section A: Left columns (01-40) near palco
    const leftCol1 = Array.from({ length: 10 }, (_, i) => byNumber.get(40 - i)).filter(Boolean) as EventTableRow[];
    const leftCol2 = Array.from({ length: 10 }, (_, i) => byNumber.get(30 - i)).filter(Boolean) as EventTableRow[];
    const leftCol3 = Array.from({ length: 10 }, (_, i) => byNumber.get(20 - i)).filter(Boolean) as EventTableRow[];
    const leftCol4 = Array.from({ length: 10 }, (_, i) => byNumber.get(10 - i)).filter(Boolean) as EventTableRow[];

    // Section B: Bottom rows (41-88)
    const bottomRow1 = Array.from({ length: 12 }, (_, i) => byNumber.get(41 + i)).filter(Boolean) as EventTableRow[];
    const bottomRow2 = Array.from({ length: 12 }, (_, i) => byNumber.get(53 + i)).filter(Boolean) as EventTableRow[];
    const bottomRow3 = Array.from({ length: 12 }, (_, i) => byNumber.get(65 + i)).filter(Boolean) as EventTableRow[];
    const bottomRow4 = Array.from({ length: 12 }, (_, i) => byNumber.get(77 + i)).filter(Boolean) as EventTableRow[];

    // Section C: Right columns (89-123)
    const rightRows: EventTableRow[][] = [];
    for (let r = 0; r < 7; r++) {
      const row: EventTableRow[] = [];
      for (let c = 0; c < 5; c++) {
        const num = 89 + r * 5 + c;
        const t = byNumber.get(num);
        if (t) row.push(t);
      }
      rightRows.push(row);
    }

    return { leftCol1, leftCol2, leftCol3, leftCol4, bottomRow1, bottomRow2, bottomRow3, bottomRow4, rightRows };
  }, [tables]);

  const seatsByTable = useMemo(() => {
    const map = new Map<string, EventSeatRow[]>();
    seats.forEach(s => {
      if (!map.has(s.table_id)) map.set(s.table_id, []);
      map.get(s.table_id)!.push(s);
    });
    return map;
  }, [seats]);

  const renderTable = (table: EventTableRow) => {
    const isSelected = selectedTables.includes(table.id);
    const tableSeats = seatsByTable.get(table.id) || [];
    const availableSeats = tableSeats.filter(s => s.status === 'available').length;

    return (
      <button
        key={table.id}
        onClick={(e) => {
          if (e.detail === 2) {
            setDetailTable(table);
          } else {
            if (table.status === 'available') {
              onToggleTable(table.id);
            } else {
              setDetailTable(table);
            }
          }
        }}
        className={cn(
          'relative w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 shadow-lg',
          STATUS_COLORS[table.status] || STATUS_COLORS.available,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10',
          table.status === 'blocked' && 'cursor-not-allowed opacity-60',
        )}
        title={`Mesa ${table.table_number} - ${AREA_LABELS[table.area]} - ${formatCurrency(table.price)}`}
      >
        <span className="text-[10px] md:text-xs font-bold leading-none text-foreground drop-shadow-sm">
          {table.table_number}
        </span>
        {table.status === 'available' && (
          <span className="text-[8px] leading-none opacity-80">{availableSeats}</span>
        )}
      </button>
    );
  };

  const renderColumn = (col: EventTableRow[]) => (
    <div className="flex flex-col gap-1">
      {col.map(renderTable)}
    </div>
  );

  const renderRow = (row: EventTableRow[]) => (
    <div className="flex gap-1">
      {row.map(renderTable)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-400" />
          <span className="text-muted-foreground">Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-500 border border-red-400" />
          <span className="text-muted-foreground">Reservado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted-foreground/40 border border-muted-foreground/30" />
          <span className="text-muted-foreground">Bloqueado</span>
        </div>
        <div className="border-l border-border pl-4 flex gap-3">
          {Object.entries(AREA_LABELS).map(([key, label]) => (
            <span key={key} className={cn('font-medium', AREA_BADGE[key])}>{label}</span>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-card border border-border rounded-xl p-4 overflow-auto">
        <div className="min-w-[700px]">
          {/* PALCO - Stage at top */}
          <div className="flex justify-center mb-6">
            <div className="bg-secondary border-2 border-primary/30 rounded-xl px-16 py-3 text-center">
              <span className="text-sm font-bold text-primary tracking-widest">🎵 PALCO</span>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Left Section: 4 columns (tables 01-40) */}
            <div className="flex gap-1">
              {renderColumn(sections.leftCol1)}
              {renderColumn(sections.leftCol2)}
              {renderColumn(sections.leftCol3)}
              {renderColumn(sections.leftCol4)}
            </div>

            {/* Center: Stage area + labels */}
            <div className="flex flex-col items-center justify-between py-4 min-w-[80px]">
              <div className="text-xs text-muted-foreground font-medium bg-secondary/50 rounded px-2 py-1">
                PISTA
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="bg-secondary/30 rounded px-2 py-1 text-center">🚻 WC</div>
                <div className="bg-secondary/30 rounded px-2 py-1 text-center">🍽️ Cantina</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium bg-secondary/50 rounded px-2 py-1">
                ENTRADA
              </div>
            </div>

            {/* Right Section: tables 89-123 */}
            <div className="flex flex-col gap-1">
              {sections.rightRows.map((row, i) => (
                <div key={i} className="flex gap-1">
                  {row.map(renderTable)}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: tables 41-88 */}
          <div className="mt-6 flex flex-col gap-1 items-center">
            {renderRow(sections.bottomRow1)}
            {renderRow(sections.bottomRow2)}
            <div className="h-3" />
            {renderRow(sections.bottomRow3)}
            {renderRow(sections.bottomRow4)}
          </div>
        </div>
      </div>

      {/* Table Detail Modal */}
      {detailTable && (
        <TableDetailModal
          table={detailTable}
          seats={seatsByTable.get(detailTable.id) || []}
          eventId={eventId}
          open={!!detailTable}
          onClose={() => setDetailTable(null)}
        />
      )}
    </div>
  );
}
