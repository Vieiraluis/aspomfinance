import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface EventRow {
  id: string;
  user_id: string;
  name: string;
  event_date: string;
  event_time: string;
  location: string;
  layout_url: string | null;
  capacity: number;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EventTableRow {
  id: string;
  event_id: string;
  user_id: string;
  table_number: number;
  status: string;
  area: string;
  pos_x: number;
  pos_y: number;
  seats_count: number;
  price: number;
  created_at: string;
}

export interface EventSeatRow {
  id: string;
  table_id: string;
  user_id: string;
  seat_number: number;
  status: string;
  created_at: string;
}

export interface EventReservationRow {
  id: string;
  user_id: string;
  event_id: string;
  client_name: string;
  client_document: string | null;
  client_phone: string | null;
  total_amount: number;
  payment_method: string | null;
  status: string;
  qr_code: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useEvents() {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
    enabled: !!user,
  });
}

export function useEvent(eventId: string | undefined) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId!)
        .single();
      if (error) throw error;
      return data as EventRow;
    },
    enabled: !!user && !!eventId,
  });
}

export function useEventTables(eventId: string | undefined) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event_tables_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_tables',
        filter: `event_id=eq.${eventId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['event_tables', eventId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, queryClient]);

  return useQuery({
    queryKey: ['event_tables', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_tables')
        .select('*')
        .eq('event_id', eventId!)
        .order('table_number');
      if (error) throw error;
      return data as EventTableRow[];
    },
    enabled: !!user && !!eventId,
  });
}

export function useEventSeats(eventId: string | undefined) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event_seats_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_seats',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['event_seats', eventId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, queryClient]);

  return useQuery({
    queryKey: ['event_seats', eventId],
    queryFn: async () => {
      // Get all table ids for this event first
      const { data: tables } = await supabase
        .from('event_tables')
        .select('id')
        .eq('event_id', eventId!);
      if (!tables || tables.length === 0) return [] as EventSeatRow[];
      const tableIds = tables.map(t => t.id);
      const { data, error } = await supabase
        .from('event_seats')
        .select('*')
        .in('table_id', tableIds)
        .order('seat_number');
      if (error) throw error;
      return data as EventSeatRow[];
    },
    enabled: !!user && !!eventId,
  });
}

export function useEventReservations(eventId: string | undefined) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['event_reservations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_reservations')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EventReservationRow[];
    },
    enabled: !!user && !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<EventRow>) => {
      const { error, data: created } = await supabase
        .from('events')
        .insert({ ...data, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Evento criado com sucesso!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao criar evento', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<EventRow> & { id: string }) => {
      const { error } = await supabase
        .from('events')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast({ title: 'Evento atualizado!' });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Evento excluído!' });
    },
  });
}

export function useGenerateEventLayout() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, seatsPerTable }: { eventId: string; seatsPerTable: number }) => {
      // ASPOM layout: 123 tables in specific positions
      const layout = generateASPOMLayout();

      // Delete existing tables for this event
      await supabase.from('event_tables').delete().eq('event_id', eventId);

      // Insert tables
      const tablesToInsert = layout.map(t => ({
        event_id: eventId,
        user_id: user!.id,
        table_number: t.number,
        status: 'available',
        area: t.area,
        pos_x: t.x,
        pos_y: t.y,
        seats_count: seatsPerTable,
        price: t.area === 'vip' ? 200 : t.area === 'premium' ? 150 : t.area === 'standard' ? 100 : 80,
      }));

      const { data: tables, error } = await supabase
        .from('event_tables')
        .insert(tablesToInsert as any)
        .select();
      if (error) throw error;

      // Insert seats for each table
      const seatsToInsert = (tables as EventTableRow[]).flatMap(table =>
        Array.from({ length: seatsPerTable }, (_, i) => ({
          table_id: table.id,
          user_id: user!.id,
          seat_number: i + 1,
          status: 'available',
        }))
      );

      // Insert in batches of 500
      for (let i = 0; i < seatsToInsert.length; i += 500) {
        const batch = seatsToInsert.slice(i, i + 500);
        const { error: seatError } = await supabase
          .from('event_seats')
          .insert(batch as any);
        if (seatError) throw seatError;
      }

      // Update event capacity
      await supabase
        .from('events')
        .update({ capacity: layout.length * seatsPerTable } as any)
        .eq('id', eventId);

      return tables;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_tables', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event_seats', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      toast({ title: 'Layout gerado com sucesso!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao gerar layout', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableId, status, eventId }: { tableId: string; status: string; eventId: string }) => {
      const { error } = await supabase
        .from('event_tables')
        .update({ status } as any)
        .eq('id', tableId);
      if (error) throw error;

      // Also update all seats of this table
      const { error: seatError } = await supabase
        .from('event_seats')
        .update({ status } as any)
        .eq('table_id', tableId);
      if (seatError) throw seatError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_tables', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event_seats', variables.eventId] });
    },
  });
}

export function useUpdateSeatStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seatId, status }: { seatId: string; status: string }) => {
      const { error } = await supabase
        .from('event_seats')
        .update({ status } as any)
        .eq('id', seatId);
      if (error) throw error;
    },
  });
}

export function useReleaseTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tableId, eventId }: { tableId: string; eventId: string }) => {
      // Find reservation items for this table
      const { data: items } = await supabase
        .from('event_reservation_items')
        .select('reservation_id')
        .eq('table_id', tableId);

      if (items && items.length > 0) {
        const reservationIds = [...new Set(items.map(i => i.reservation_id))];

        // Delete reservation items for this table
        await supabase
          .from('event_reservation_items')
          .delete()
          .eq('table_id', tableId);

        // Delete reservations that have no remaining items
        for (const resId of reservationIds) {
          const { data: remaining } = await supabase
            .from('event_reservation_items')
            .select('id')
            .eq('reservation_id', resId)
            .limit(1);
          if (!remaining || remaining.length === 0) {
            await supabase
              .from('event_reservations')
              .delete()
              .eq('id', resId);
          }
        }
      }

      // Set table and seats back to available
      await supabase
        .from('event_tables')
        .update({ status: 'available' } as any)
        .eq('id', tableId);
      await supabase
        .from('event_seats')
        .update({ status: 'available' } as any)
        .eq('table_id', tableId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_tables', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event_seats', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event_reservations', variables.eventId] });
      toast({ title: 'Mesa liberada e reserva excluída!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao liberar mesa', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTablePrice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tableId, price }: { tableId: string; price: number; eventId: string }) => {
      const { error } = await supabase
        .from('event_tables')
        .update({ price } as any)
        .eq('id', tableId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_tables', variables.eventId] });
      toast({ title: 'Preço atualizado!' });
    },
  });
}

export function useBulkUpdateTablePrice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tableIds, price, eventId }: { tableIds: string[]; price: number; eventId: string }) => {
      for (const tableId of tableIds) {
        const { error } = await supabase
          .from('event_tables')
          .update({ price } as any)
          .eq('id', tableId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_tables', variables.eventId] });
      toast({ title: `Preço atualizado para ${variables.tableIds.length} mesa(s)!` });
    },
  });
}

export function useUpdateTableSeatsCount() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tableId, seatsCount, eventId }: { tableId: string; seatsCount: number; eventId: string }) => {
      // Update table seats_count
      const { error } = await supabase
        .from('event_tables')
        .update({ seats_count: seatsCount } as any)
        .eq('id', tableId);
      if (error) throw error;

      // Delete existing seats
      await supabase.from('event_seats').delete().eq('table_id', tableId);

      // Re-create seats with new count
      const seatsToInsert = Array.from({ length: seatsCount }, (_, i) => ({
        table_id: tableId,
        user_id: user!.id,
        seat_number: i + 1,
        status: 'available',
      }));

      const { error: seatError } = await supabase
        .from('event_seats')
        .insert(seatsToInsert as any);
      if (seatError) throw seatError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_tables', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event_seats', variables.eventId] });
      toast({ title: 'Assentos atualizados!' });
    },
  });
}

export interface ReservationItemRow {
  id: string;
  reservation_id: string;
  table_id: string;
  seat_id: string | null;
  unit_price: number;
  user_id: string;
  created_at: string;
}

export function useReservationItems(eventId: string | undefined) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['event_reservation_items', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_reservation_items')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data as ReservationItemRow[];
    },
    enabled: !!user && !!eventId,
  });
}

export function useCheckinReservation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reservationId, eventId }: { reservationId: string; eventId: string }) => {
      const { error } = await supabase
        .from('event_reservations')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() } as any)
        .eq('id', reservationId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_reservations', variables.eventId] });
      toast({ title: 'Check-in realizado com sucesso!' });
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      eventId: string;
      clientName: string;
      clientDocument?: string;
      clientPhone?: string;
      paymentMethod: string;
      items: { tableId: string; seatId?: string; price: number }[];
    }) => {
      const totalAmount = data.items.reduce((sum, item) => sum + item.price, 0);
      const qrCode = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create reservation
      const { data: reservation, error } = await supabase
        .from('event_reservations')
        .insert({
          user_id: user!.id,
          event_id: data.eventId,
          client_name: data.clientName,
          client_document: data.clientDocument || null,
          client_phone: data.clientPhone || null,
          total_amount: totalAmount,
          payment_method: data.paymentMethod,
          status: 'confirmed',
          qr_code: qrCode,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Create reservation items
      const items = data.items.map(item => ({
        reservation_id: (reservation as EventReservationRow).id,
        user_id: user!.id,
        table_id: item.tableId,
        seat_id: item.seatId || null,
        unit_price: item.price,
      }));

      const { error: itemError } = await supabase
        .from('event_reservation_items')
        .insert(items as any);
      if (itemError) throw itemError;

      // Update table/seat statuses to reserved
      const tableIds = [...new Set(data.items.map(i => i.tableId))];
      for (const tableId of tableIds) {
        await supabase
          .from('event_tables')
          .update({ status: 'reserved' } as any)
          .eq('id', tableId);
        await supabase
          .from('event_seats')
          .update({ status: 'reserved' } as any)
          .eq('table_id', tableId);
      }

      return reservation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event_tables', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event_seats', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event_reservations', variables.eventId] });
      toast({ title: 'Reserva realizada com sucesso!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro na reserva', description: e.message, variant: 'destructive' });
    },
  });
}

// ASPOM Layout with 123 tables
function generateASPOMLayout(): { number: number; x: number; y: number; area: string }[] {
  const tables: { number: number; x: number; y: number; area: string }[] = [];

  // Section 1: Left side (tables 01-40) - 4 columns x 10 rows near the stage
  // Column 1 (leftmost): 31-40
  for (let i = 0; i < 10; i++) {
    tables.push({ number: 31 + i, x: 1, y: i + 1, area: i < 3 ? 'vip' : 'premium' });
  }
  // Column 2: 21-30
  for (let i = 0; i < 10; i++) {
    tables.push({ number: 21 + i, x: 2, y: i + 1, area: i < 3 ? 'vip' : 'premium' });
  }
  // Column 3: 11-20
  for (let i = 0; i < 10; i++) {
    tables.push({ number: 11 + i, x: 3, y: i + 1, area: 'premium' });
  }
  // Column 4: 01-10
  for (let i = 0; i < 10; i++) {
    tables.push({ number: 1 + i, x: 4, y: i + 1, area: 'standard' });
  }

  // Section 2: Bottom area (tables 41-88) - 4 rows x 12 columns
  // Row 1: 41-52
  for (let i = 0; i < 12; i++) {
    tables.push({ number: 41 + i, x: i + 1, y: 12, area: 'standard' });
  }
  // Row 2: 53-64
  for (let i = 0; i < 12; i++) {
    tables.push({ number: 53 + i, x: i + 1, y: 13, area: 'standard' });
  }
  // Row 3: 65-76
  for (let i = 0; i < 12; i++) {
    tables.push({ number: 65 + i, x: i + 1, y: 15, area: 'economy' });
  }
  // Row 4: 77-88
  for (let i = 0; i < 12; i++) {
    tables.push({ number: 77 + i, x: i + 1, y: 16, area: 'economy' });
  }

  // Section 3: Right side (tables 89-123) - 5 columns x 7 rows
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      const num = 89 + row * 5 + col;
      if (num <= 123) {
        tables.push({ number: num, x: col + 6, y: row + 1, area: row < 2 ? 'vip' : 'premium' });
      }
    }
  }

  return tables;
}
