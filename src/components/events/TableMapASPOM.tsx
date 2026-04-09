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

  // Layout sections
  // LEFT: Entrance corridor - Tables 01-40 in 4 columns x 10 rows
  // Col1(leftmost): 31-40, Col2: 21-30, Col3: 11-20, Col4(near pista): 01-10
  const entranceCols = useMemo(() => [
    Array.from({ length: 10 }, (_, i) => byNumber.get(31 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(21 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(11 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(1 + i)).filter(Boolean) as EventTableRow[],
  ], [byNumber]);

  // LEFT of pista/palco: Tables 41-88 (48 tables, top to bottom) - 4 columns x 12 rows
  const leftCols = useMemo(() => [
    Array.from({ length: 12 }, (_, i) => byNumber.get(41 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(53 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(65 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(77 + i)).filter(Boolean) as EventTableRow[],
  ], [byNumber]);

  // In front of palco: Tables 89-123 (35 tables) - 7 rows x 5 cols, left to right
  const frontRows = useMemo(() => {
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
          'relative w-9 h-9 md:w-11 md:h-11 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 shadow-md',
          STATUS_COLORS[table.status] || STATUS_COLORS.available,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10',
          table.status === 'blocked' && 'cursor-not-allowed opacity-60',
        )}
        title={`Mesa ${table.table_number} - ${AREA_LABELS[table.area]} - ${formatCurrency(table.price)}`}
      >
        <span className="text-[9px] md:text-[11px] font-bold leading-none text-foreground drop-shadow-sm">
          {String(table.table_number).padStart(2, '0')}
        </span>
        {table.status === 'available' && (
          <span className="text-[7px] leading-none opacity-80">{availableSeats}</span>
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
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-primary tracking-wide">🏟️ Ginásio Principal</h2>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs justify-center">
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

      {/* Map Container - Landscape */}
      <div className="relative bg-card border border-border rounded-xl p-3 overflow-auto">
        <div className="min-w-[850px] flex flex-col gap-4">
          {/* TOP ROW: Entrance + Pista + Tables 41-88 area */}
          <div className="flex gap-3">
            {/* Entrance corridor: tables 01-40 (4 cols x 10 rows) */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] font-bold text-muted-foreground bg-secondary/60 rounded px-2 py-0.5 mb-1">
                🚪 ENTRADA
              </div>
              <div className="flex gap-0.5">
                {entranceCols.map((col, i) => (
                  <div key={`ecol-${i}`}>{renderColumn(col)}</div>
                ))}
              </div>
            </div>

            {/* Icons: Bar + Banheiro between entrance/left tables and pista */}
            <div className="flex flex-col items-center justify-center gap-3 min-w-[50px]">
              <div className="bg-secondary/40 rounded px-1.5 py-1 text-[10px] text-muted-foreground text-center">
                🍺<br/>Bar
              </div>
              <div className="bg-secondary/40 rounded px-1.5 py-1 text-[10px] text-muted-foreground text-center">
                🚹<br/>WC
              </div>
            </div>

            {/* Tables 41-88 (left of pista and palco, 4 cols x 12 rows, top to bottom) */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] font-medium text-muted-foreground bg-secondary/40 rounded px-2 py-0.5 mb-1">
                Mesas 41-88
              </div>
              <div className="flex gap-0.5">
                {leftCols.map((col, i) => (
                  <div key={`lcol-${i}`}>{renderColumn(col)}</div>
                ))}
              </div>
            </div>

            {/* PISTA DE DANÇA (center) */}
            <div className="flex-1 flex items-center justify-center">
              <div className="border-2 border-dashed border-primary/30 rounded-2xl px-6 py-10 flex items-center justify-center min-w-[140px]">
                <span className="text-sm font-bold text-primary/60 tracking-widest rotate-0">
                  💃 PISTA DE DANÇA
                </span>
              </div>
            </div>
          </div>

          {/* Tables 89-123 (in front of palco, 7 rows x 5 cols) */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-[10px] font-medium text-muted-foreground bg-secondary/40 rounded px-2 py-0.5">
              Mesas 89-123
            </div>
            <div className="flex flex-col gap-0.5 items-center">
              {frontRows.map((row, i) => (
                <div key={`fr-${i}`} className="flex gap-0.5">
                  {row.map(renderTable)}
                </div>
              ))}
            </div>
          </div>

          {/* PALCO - Bottom center */}
          <div className="flex justify-center">
            <div className="bg-secondary border-2 border-primary/40 rounded-xl px-20 py-3 text-center">
              <span className="text-sm font-bold text-primary tracking-widest">🎵 PALCO</span>
            </div>
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
