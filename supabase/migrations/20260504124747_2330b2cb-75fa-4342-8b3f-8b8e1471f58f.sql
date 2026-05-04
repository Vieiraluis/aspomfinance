
-- Espaços para locação
CREATE TABLE public.espacos_locacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  capacidade_maxima integer NOT NULL DEFAULT 0,
  preco_base numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.espacos_locacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own espacos" ON public.espacos_locacao FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own espacos" ON public.espacos_locacao FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own espacos" ON public.espacos_locacao FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own espacos" ON public.espacos_locacao FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_espacos_updated BEFORE UPDATE ON public.espacos_locacao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reservas de locação
CREATE TABLE public.locacao_reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid,
  espaco_id uuid NOT NULL REFERENCES public.espacos_locacao(id) ON DELETE RESTRICT,
  cliente_nome text NOT NULL,
  cliente_documento text,
  cliente_telefone text,
  cliente_email text,
  tipo_evento text,
  data_evento date NOT NULL,
  turno text NOT NULL CHECK (turno IN ('manha','tarde','noite')),
  hora_inicio time,
  hora_fim time,
  total_lugares integer NOT NULL DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','confirmada','cancelada')),
  contrato_modelo_url text,
  contrato_assinado_url text,
  protocolo text UNIQUE,
  whatsapp_enviado_at timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_locacao_data ON public.locacao_reservas(data_evento);
CREATE INDEX idx_locacao_espaco_data ON public.locacao_reservas(espaco_id, data_evento, turno);

ALTER TABLE public.locacao_reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own locacao" ON public.locacao_reservas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own locacao" ON public.locacao_reservas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own locacao" ON public.locacao_reservas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own locacao" ON public.locacao_reservas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_locacao_updated BEFORE UPDATE ON public.locacao_reservas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar protocolo único ao confirmar reserva
CREATE OR REPLACE FUNCTION public.generate_locacao_protocolo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq int;
  ym text;
BEGIN
  IF NEW.status = 'confirmada' AND (NEW.protocolo IS NULL OR NEW.protocolo = '') THEN
    ym := to_char(NEW.data_evento, 'YYYYMM');
    SELECT COALESCE(MAX(
      CAST(NULLIF(split_part(protocolo, '-', 3), '') AS int)
    ), 0) + 1
    INTO next_seq
    FROM public.locacao_reservas
    WHERE user_id = NEW.user_id
      AND protocolo LIKE 'LOC-' || ym || '-%';
    NEW.protocolo := 'LOC-' || ym || '-' || lpad(next_seq::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_locacao_protocolo
BEFORE INSERT OR UPDATE ON public.locacao_reservas
FOR EACH ROW EXECUTE FUNCTION public.generate_locacao_protocolo();

-- Bucket de contratos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read contracts" ON storage.objects
FOR SELECT USING (bucket_id = 'contracts');

CREATE POLICY "Users upload own contracts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own contracts" ON storage.objects
FOR UPDATE USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own contracts" ON storage.objects
FOR DELETE USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);
