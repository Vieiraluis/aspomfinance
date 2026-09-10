ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS payment_terms text;

CREATE OR REPLACE FUNCTION public.generate_account_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix text;
  next_seq int;
  new_code text;
BEGIN
  IF NEW.code IS NOT NULL AND NEW.code <> '' THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'payable' THEN
    prefix := 'CP';
  ELSE
    prefix := 'CR';
  END IF;

  SELECT COALESCE(MAX(CAST(substring(code from '[0-9]+$') AS int)), 0) + 1
  INTO next_seq
  FROM public.accounts
  WHERE user_id = NEW.user_id
    AND code ~ ('^' || prefix || '-[0-9]+$');

  new_code := prefix || '-' || lpad(next_seq::text, 6, '0');

  WHILE EXISTS (
    SELECT 1 FROM public.accounts
    WHERE user_id = NEW.user_id AND code = new_code
  ) LOOP
    next_seq := next_seq + 1;
    new_code := prefix || '-' || lpad(next_seq::text, 6, '0');
  END LOOP;

  NEW.code := new_code;
  RETURN NEW;
END;
$function$;