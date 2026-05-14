
-- ASSOCIADOS
CREATE TABLE public.associados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text,
  nome text NOT NULL,
  cpf text,
  rg_pmerj text,
  identidade text,
  posto_graduacao text,
  matricula_associacao text,
  email text,
  telefone text,
  endereco_cep text,
  endereco_rua text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_estado text,
  banco text,
  agencia text,
  conta text,
  pix_chave text,
  valor_mensalidade numeric NOT NULL DEFAULT 0,
  data_adesao date,
  dia_vencimento int NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX associados_user_matricula_uq
  ON public.associados(user_id, matricula_associacao)
  WHERE matricula_associacao IS NOT NULL;

ALTER TABLE public.associados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own associados" ON public.associados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own associados" ON public.associados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own associados" ON public.associados FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own associados" ON public.associados FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_associados_updated_at
BEFORE UPDATE ON public.associados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MENSALIDADES
CREATE TABLE public.mensalidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  associado_id uuid NOT NULL REFERENCES public.associados(id) ON DELETE CASCADE,
  competencia text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  pago_em date,
  status text NOT NULL DEFAULT 'pendente',
  forma_pagamento text,
  bank_account_id uuid,
  linha_digitavel text,
  pix_payload text,
  pix_txid text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, associado_id, competencia)
);

CREATE INDEX mensalidades_user_competencia_idx ON public.mensalidades(user_id, competencia);
CREATE INDEX mensalidades_associado_idx ON public.mensalidades(associado_id);

ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mensalidades" ON public.mensalidades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mensalidades" ON public.mensalidades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mensalidades" ON public.mensalidades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mensalidades" ON public.mensalidades FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mensalidades_updated_at
BEFORE UPDATE ON public.mensalidades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PIX em receipt_settings
ALTER TABLE public.receipt_settings
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_key_type text,
  ADD COLUMN IF NOT EXISTS beneficiario_nome text,
  ADD COLUMN IF NOT EXISTS beneficiario_cidade text;

-- Storage policies para fotos no bucket logos (pasta associados/<user_id>/)
CREATE POLICY "Users upload own associado photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'associados'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users update own associado photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'associados'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users delete own associado photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'associados'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
