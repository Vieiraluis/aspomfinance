CREATE TABLE public.portaria_locais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portaria_locais TO authenticated;
GRANT ALL ON public.portaria_locais TO service_role;
ALTER TABLE public.portaria_locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portaria_locais_select" ON public.portaria_locais FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "portaria_locais_insert" ON public.portaria_locais FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portaria_locais_update" ON public.portaria_locais FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portaria_locais_delete" ON public.portaria_locais FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.portaria_plantoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  data date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portaria_plantoes TO authenticated;
GRANT ALL ON public.portaria_plantoes TO service_role;
ALTER TABLE public.portaria_plantoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portaria_plantoes_select" ON public.portaria_plantoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "portaria_plantoes_insert" ON public.portaria_plantoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portaria_plantoes_update" ON public.portaria_plantoes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portaria_plantoes_delete" ON public.portaria_plantoes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.portaria_visitas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitante_nome text NOT NULL,
  documento text,
  local_id uuid REFERENCES public.portaria_locais(id) ON DELETE SET NULL,
  destino_nome text,
  entrada_at timestamptz NOT NULL DEFAULT now(),
  saida_at timestamptz,
  foto_url text,
  observacoes text,
  recepcionista_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  recepcionista_nome text,
  recepcionista_foto_url text,
  registrado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portaria_visitas TO authenticated;
GRANT ALL ON public.portaria_visitas TO service_role;
ALTER TABLE public.portaria_visitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portaria_visitas_select" ON public.portaria_visitas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "portaria_visitas_insert" ON public.portaria_visitas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portaria_visitas_update" ON public.portaria_visitas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portaria_visitas_delete" ON public.portaria_visitas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_portaria_visitas_user_entrada ON public.portaria_visitas(user_id, entrada_at DESC);
CREATE INDEX idx_portaria_visitas_ativas ON public.portaria_visitas(user_id) WHERE saida_at IS NULL;
CREATE INDEX idx_portaria_plantoes_user_data ON public.portaria_plantoes(user_id, data);

CREATE TRIGGER trg_portaria_locais_updated BEFORE UPDATE ON public.portaria_locais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_portaria_plantoes_updated BEFORE UPDATE ON public.portaria_plantoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_portaria_visitas_updated BEFORE UPDATE ON public.portaria_visitas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();