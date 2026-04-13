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

  const byNumber = useMemo(() => new Map(tables.map(t => [t.table_number, t])), [tables]);

  const seatsByTable = useMemo(() => {
    const map = new Map<string, EventSeatRow[]>();
    seats.forEach(s => {
      if (!map.has(s.table_id)) map.set(s.table_id, []);
      map.get(s.table_id)!.push(s);
    });
    return map;
  }, [seats]);

  // LEFT: Tables 01-40, 4 cols x 10 rows. Numbering bottom-to-top (01 at bottom, 10 at top per col)
  // We reverse each column so index 0 renders at top = highest number, bottom = lowest (01)
  const entranceCols = useMemo(() => [
    Array.from({ length: 10 }, (_, i) => byNumber.get(10 - i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(20 - i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(30 - i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(40 - i)).filter(Boolean) as EventTableRow[],
  ], [byNumber]);

  // RIGHT: Tables 41-88, 4 cols x 12 rows (top to bottom)
  const rightCols = useMemo(() => [
    Array.from({ length: 12 }, (_, i) => byNumber.get(41 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(53 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(65 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(77 + i)).filter(Boolean) as EventTableRow[],
  ], [byNumber]);

  // TOP CENTER: Tables 89-123 (35 tables) - 7 rows x 5 cols
  const topRows = useMemo(() => {
    const rows: EventTableRow[][] = [];
    for (let r = 0; r < 7; r++) {
      const row: EventTableRow[] = [];
      for (let c = 0; c < 5; c++) {
        const num = 89 + r * 5 + c;
        if (num <= 123) {
          const t = byNumber.get(num);
          if (t) row.push(t);
        }
      }
      rows.push(row);
    }
    return rows;
  }, [byNumber]);

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
          'relative w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 shadow-md',
          STATUS_COLORS[table.status] || STATUS_COLORS.available,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10',
          table.status === 'blocked' && 'cursor-not-allowed opacity-60',
        )}
        title={`Mesa ${table.table_number} - ${AREA_LABELS[table.area]} - ${formatCurrency(table.price)}`}
      >
        <span className="text-[8px] md:text-[10px] font-bold leading-none text-foreground drop-shadow-sm">
          {String(table.table_number).padStart(2, '0')}
        </span>
        {table.status === 'available' && (
          <span className="text-[6px] leading-none opacity-80">{availableSeats}</span>
        )}
      </button>
    );
  };

  const renderColumn = (col: EventTableRow[]) => (
    <div className="flex flex-col gap-0.5">
      {col.map(renderTable)}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-primary tracking-wide">🏟️ Ginásio Principal</h2>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400" />
          <span className="text-muted-foreground">Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-red-500 border border-red-400" />
          <span className="text-muted-foreground">Reservado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-muted-foreground/40 border border-muted-foreground/30" />
          <span className="text-muted-foreground">Bloqueado</span>
        </div>
        <div className="border-l border-border pl-3 flex gap-2">
          {Object.entries(AREA_LABELS).map(([key, label]) => (
            <span key={key} className={cn('font-medium', AREA_BADGE[key])}>{label}</span>
          ))}
        </div>
      </div>

      {/* Map Container - Landscape */}
      <div className="relative bg-card border border-border rounded-xl p-3 overflow-auto">
        <div className="min-w-[900px] flex flex-col gap-2">

          {/* TOP ROW: Tables 89-123 centered + Bar/WC top-right */}
          <div className="flex items-start">
            <div className="flex-1" />
            <div className="flex flex-col items-center gap-1">
              <div className="text-[9px] text-muted-foreground">Mesas 89-123</div>
              <div className="flex flex-col gap-0.5 items-center">
                {topRows.map((row, i) => (
                  <div key={`tr-${i}`} className="flex gap-0.5">
                    {row.map(renderTable)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex justify-end gap-3">
              <div className="animate-pulse bg-secondary/60 rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground text-center flex items-center gap-1 border border-border shadow-sm">
                🍺 <span className="font-semibold">Bar</span>
              </div>
              <div className="animate-pulse bg-secondary/60 rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground text-center flex items-center gap-1 border border-border shadow-sm">
                🚹 <span className="font-semibold">WC</span>
              </div>
            </div>
          </div>

          {/* MIDDLE ROW: Left tables 01-40 | PISTA DE DANÇA (center) | Tables 41-88 (right) */}
          <div className="flex gap-3 items-stretch">
            {/* Tables 01-40 (4 cols x 10 rows, 01 at bottom) */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="text-[9px] text-muted-foreground mb-0.5">Mesas 01-40</div>
              <div className="flex gap-0.5">
                {entranceCols.map((col, i) => (
                  <div key={`ecol-${i}`}>{renderColumn(col)}</div>
                ))}
              </div>
            </div>

            {/* PISTA DE DANÇA (center) */}
            <div className="flex-1 flex items-center justify-center">
              <div className="border-2 border-dashed border-primary/30 rounded-2xl px-4 py-8 flex items-center justify-center w-full max-w-[240px] min-h-[220px] animate-[pulse_3s_ease-in-out_infinite] bg-primary/5">
                <span className="text-sm font-bold text-primary/70 tracking-widest animate-[pulse_2s_ease-in-out_infinite]">
                  💃 PISTA DE DANÇA
                </span>
              </div>
            </div>

            {/* Tables 41-88 (right side, 4 cols x 12 rows) */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="text-[9px] text-muted-foreground mb-0.5">Mesas 41-88</div>
              <div className="flex gap-0.5">
                {rightCols.map((col, i) => (
                  <div key={`rcol-${i}`}>{renderColumn(col)}</div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Entrance (left) + PALCO (center) */}
          <div className="flex items-end gap-3 mt-1">
            {/* Entrance icon - bottom left next to palco */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="animate-bounce bg-secondary/80 border-2 border-primary/50 rounded-xl px-4 py-2 text-center shadow-lg">
                <span className="text-sm font-bold text-primary tracking-wide">🚪 ENTRADA</span>
              </div>
            </div>

            {/* PALCO - Bottom center */}
            <div className="flex-1 flex justify-center">
              <div className="bg-secondary border-2 border-primary/40 rounded-xl px-16 py-3 text-center shadow-lg animate-[pulse_4s_ease-in-out_infinite]">
                <span className="text-sm font-bold text-primary tracking-widest">🎵 PALCO</span>
              </div>
            </div>

            <div className="shrink-0 w-[80px]" />
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
