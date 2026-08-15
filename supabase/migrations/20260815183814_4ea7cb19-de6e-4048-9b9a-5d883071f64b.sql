CREATE TABLE public.asaas_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  mensalidade_id uuid REFERENCES public.mensalidades(id) ON DELETE SET NULL,
  account_ids uuid[] NOT NULL DEFAULT '{}',
  asaas_customer_id text,
  asaas_payment_id text NOT NULL UNIQUE,
  billing_type text NOT NULL DEFAULT 'BOLETO',
  description text,
  value numeric NOT NULL,
  net_value numeric,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  invoice_url text,
  bank_slip_url text,
  identification_field text,
  pix_payload text,
  pix_qr_image text,
  payment_date date,
  last_event text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asaas_charges_user ON public.asaas_charges(user_id, created_at DESC);
CREATE INDEX idx_asaas_charges_payment ON public.asaas_charges(asaas_payment_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asaas_charges TO authenticated;
GRANT ALL ON public.asaas_charges TO service_role;

ALTER TABLE public.asaas_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own asaas charges" ON public.asaas_charges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own asaas charges" ON public.asaas_charges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own asaas charges" ON public.asaas_charges FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own asaas charges" ON public.asaas_charges FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_asaas_charges_updated BEFORE UPDATE ON public.asaas_charges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();