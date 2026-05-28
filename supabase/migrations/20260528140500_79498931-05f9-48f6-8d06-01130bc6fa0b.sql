-- Performance indexes for filtered/paginated list pages
CREATE INDEX IF NOT EXISTS idx_accounts_user_due ON public.accounts(user_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_user_status ON public.accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_accounts_user_type ON public.accounts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_user_category ON public.accounts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON public.accounts(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mensalidades_user_competencia ON public.mensalidades(user_id, competencia);
CREATE INDEX IF NOT EXISTS idx_mensalidades_user_status ON public.mensalidades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mensalidades_associado ON public.mensalidades(associado_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_paid ON public.payments(user_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_account ON public.payments(account_id);

CREATE INDEX IF NOT EXISTS idx_associados_user_status ON public.associados(user_id, status);