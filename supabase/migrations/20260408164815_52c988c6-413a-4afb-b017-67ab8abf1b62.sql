
-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL DEFAULT '20:00',
  location TEXT NOT NULL DEFAULT '',
  layout_url TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event tables (mesas)
CREATE TABLE public.event_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  area TEXT NOT NULL DEFAULT 'standard',
  pos_x NUMERIC NOT NULL DEFAULT 0,
  pos_y NUMERIC NOT NULL DEFAULT 0,
  seats_count INTEGER NOT NULL DEFAULT 10,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own event_tables" ON public.event_tables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own event_tables" ON public.event_tables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own event_tables" ON public.event_tables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own event_tables" ON public.event_tables FOR DELETE USING (auth.uid() = user_id);

-- Event seats (assentos)
CREATE TABLE public.event_seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.event_tables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seat_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own event_seats" ON public.event_seats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own event_seats" ON public.event_seats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own event_seats" ON public.event_seats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own event_seats" ON public.event_seats FOR DELETE USING (auth.uid() = user_id);

-- Event reservations
CREATE TABLE public.event_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_document TEXT,
  client_phone TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own event_reservations" ON public.event_reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own event_reservations" ON public.event_reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own event_reservations" ON public.event_reservations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own event_reservations" ON public.event_reservations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_event_reservations_updated_at BEFORE UPDATE ON public.event_reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reservation items
CREATE TABLE public.event_reservation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.event_reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  table_id UUID NOT NULL REFERENCES public.event_tables(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES public.event_seats(id) ON DELETE SET NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_reservation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own event_reservation_items" ON public.event_reservation_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own event_reservation_items" ON public.event_reservation_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own event_reservation_items" ON public.event_reservation_items FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for tables and seats
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_seats;
