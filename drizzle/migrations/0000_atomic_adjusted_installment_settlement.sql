ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS interest_amount numeric(15,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS discount_amount numeric(15,2) NOT NULL DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS principal_amount numeric(15,2), ADD COLUMN IF NOT EXISTS interest_amount numeric(15,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS discount_amount numeric(15,2) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS settlement_id uuid;
CREATE INDEX IF NOT EXISTS payments_settlement_id_idx ON public.payments(settlement_id);
CREATE OR REPLACE FUNCTION public.settle_account_installments(p_account_ids uuid[], p_paid_at timestamptz, p_principal numeric, p_interest numeric, p_discount numeric, p_parts jsonb, p_notes text, p_settlement_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  a public.accounts%ROWTYPE; part jsonb; v_user uuid := auth.uid(); v_type text; v_total numeric := 0; v_cash numeric; v_part_total numeric := 0; v_remaining numeric; v_principal numeric; v_interest numeric; v_discount numeric; v_account_cash numeric; v_left numeric; v_take numeric; v_part_left numeric; v_part_index int := 0; v_part_count int; v_bank uuid; v_method text; v_account_principal_left numeric; v_payment_principal numeric; v_payment_interest numeric; v_payment_discount numeric; v_interest_left numeric; v_discount_left numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  IF p_settlement_id IS NULL THEN RAISE EXCEPTION 'Identificador de baixa obrigatório'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_settlement_id::text, 0));
  IF EXISTS (SELECT 1 FROM public.payments WHERE settlement_id = p_settlement_id AND user_id = v_user) THEN RETURN; END IF;
  IF coalesce(array_length(p_account_ids,1),0) = 0 OR array_length(p_account_ids,1) <> (SELECT count(DISTINCT id) FROM unnest(p_account_ids) id) THEN RAISE EXCEPTION 'Seleção inválida'; END IF;
  IF p_paid_at IS NULL OR p_principal IS NULL OR p_interest IS NULL OR p_discount IS NULL OR p_principal <= 0 OR p_interest < 0 OR p_discount < 0 OR p_principal <> round(p_principal,2) OR p_interest <> round(p_interest,2) OR p_discount <> round(p_discount,2) THEN RAISE EXCEPTION 'Valores inválidos'; END IF;
  FOR a IN SELECT * FROM public.accounts WHERE id = ANY(p_account_ids) AND user_id = v_user ORDER BY id FOR UPDATE LOOP
    IF a.status NOT IN ('pending','overdue') THEN RAISE EXCEPTION 'Parcela já baixada ou cancelada'; END IF;
    IF v_type IS NOT NULL AND v_type <> a.type THEN RAISE EXCEPTION 'Selecione parcelas do mesmo módulo'; END IF;
    v_type := a.type; v_total := v_total + a.amount;
  END LOOP;
  IF (SELECT count(*) FROM public.accounts WHERE id = ANY(p_account_ids) AND user_id = v_user) <> array_length(p_account_ids,1) THEN RAISE EXCEPTION 'Parcela não autorizada'; END IF;
  IF p_principal > v_total OR p_discount >= p_principal + p_interest THEN RAISE EXCEPTION 'Valor excede o saldo ou desconto inválido'; END IF;
  v_cash := p_principal + p_interest - p_discount;
  IF jsonb_typeof(p_parts) <> 'array' THEN RAISE EXCEPTION 'Formas de pagamento inválidas'; END IF;
  v_part_count := jsonb_array_length(p_parts);
  IF v_part_count NOT BETWEEN 1 AND 2 THEN RAISE EXCEPTION 'Informe uma ou duas formas'; END IF;
  FOR part IN SELECT value FROM jsonb_array_elements(p_parts) LOOP
    IF (part->>'amount')::numeric <= 0 OR (part->>'amount')::numeric <> round((part->>'amount')::numeric,2) OR (part->>'amount') IS NULL OR (part->>'paymentMethod') IS NULL OR part->>'paymentMethod' NOT IN ('cash','transfer','pix','credit_card','debit_card','boleto','debit_account') THEN RAISE EXCEPTION 'Forma ou valor inválido'; END IF;
    v_bank := (part->>'bankAccountId')::uuid;
    PERFORM 1 FROM public.bank_accounts WHERE id = v_bank AND user_id = v_user AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Conta bancária inválida'; END IF;
    v_part_total := v_part_total + (part->>'amount')::numeric;
  END LOOP;
  IF v_part_total <> v_cash THEN RAISE EXCEPTION 'A soma das formas deve ser igual ao valor líquido'; END IF;
  v_remaining := p_principal;
  v_interest_left := p_interest; v_discount_left := p_discount;
  part := p_parts->0; v_part_left := (part->>'amount')::numeric;
  FOR a IN SELECT * FROM public.accounts WHERE id = ANY(p_account_ids) AND user_id = v_user ORDER BY due_date, id LOOP
    EXIT WHEN v_remaining <= 0;
    v_principal := least(a.amount, v_remaining); v_remaining := v_remaining - v_principal;
    IF v_remaining = 0 THEN v_interest := v_interest_left; v_discount := v_discount_left;
    ELSE v_interest := round(p_interest * v_principal / p_principal,2); v_discount := round(p_discount * v_principal / p_principal,2); END IF;
    v_interest_left := v_interest_left - v_interest; v_discount_left := v_discount_left - v_discount;
    v_account_cash := v_principal + v_interest - v_discount;
    v_left := v_account_cash; v_account_principal_left := v_principal;
    WHILE v_left > 0 LOOP
      IF v_part_left <= 0 THEN v_part_index := v_part_index + 1; part := p_parts->v_part_index; v_part_left := (part->>'amount')::numeric; END IF;
      v_take := least(v_left,v_part_left);
      IF v_take = v_left THEN v_payment_principal := v_account_principal_left; v_payment_interest := v_interest; v_payment_discount := v_discount;
      ELSE v_payment_principal := round(v_principal * v_take / v_account_cash,2); v_payment_interest := round(v_interest * v_take / v_left,2); v_payment_discount := v_payment_principal + v_payment_interest - v_take; END IF;
      INSERT INTO public.payments(user_id,account_id,amount,paid_at,payment_method,bank_account_id,notes,principal_amount,interest_amount,discount_amount,settlement_id)
      VALUES(v_user,a.id,v_take,p_paid_at,part->>'paymentMethod',(part->>'bankAccountId')::uuid,p_notes,v_payment_principal,v_payment_interest,v_payment_discount,p_settlement_id);
      v_account_principal_left := v_account_principal_left - v_payment_principal; v_interest := v_interest - v_payment_interest; v_discount := v_discount - v_payment_discount;
      v_left := v_left - v_take; v_part_left := v_part_left - v_take;
    END LOOP;
    UPDATE public.accounts SET status='paid', paid_at=p_paid_at, bank_account_id=(p_parts->0->>'bankAccountId')::uuid, amount=v_account_cash, interest_amount=v_account_cash-v_principal+(SELECT coalesce(sum(discount_amount),0) FROM public.payments WHERE settlement_id=p_settlement_id AND account_id=a.id), discount_amount=(SELECT coalesce(sum(discount_amount),0) FROM public.payments WHERE settlement_id=p_settlement_id AND account_id=a.id) WHERE id=a.id;
    IF v_principal < a.amount THEN
      INSERT INTO public.accounts(user_id,type,description,document_number,payment_terms,amount,due_date,status,supplier_id,supplier_name,category,parent_id,notes,installment_number,total_installments,billing_slip_url)
      VALUES(v_user,a.type,a.description,a.document_number,a.payment_terms,a.amount-v_principal,a.due_date,'pending',a.supplier_id,a.supplier_name,a.category,coalesce(a.parent_id,a.id),a.notes,a.installment_number,a.total_installments,a.billing_slip_url);
    END IF;
  END LOOP;
  FOR part IN SELECT value FROM jsonb_array_elements(p_parts) LOOP
    UPDATE public.bank_accounts SET current_balance=current_balance+CASE WHEN v_type='receivable' THEN (part->>'amount')::numeric ELSE -(part->>'amount')::numeric END WHERE id=(part->>'bankAccountId')::uuid AND user_id=v_user;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.settle_account_installments(uuid[],timestamptz,numeric,numeric,numeric,jsonb,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.settle_account_installments(uuid[],timestamptz,numeric,numeric,numeric,jsonb,text,uuid) TO authenticated;