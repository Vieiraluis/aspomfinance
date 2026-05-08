CREATE OR REPLACE FUNCTION public.generate_account_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix text;
  month_year text;
  next_seq int;
  new_code text;
BEGIN
  IF NEW.type = 'payable' THEN
    prefix := 'PAG';
  ELSE
    prefix := 'REC';
  END IF;

  month_year := to_char(NEW.due_date, 'MM/YYYY');

  -- Look up by code pattern (not due_date) to avoid collisions when due_date was edited
  SELECT COALESCE(MAX(
    CAST(split_part(split_part(code, '-', 2), '/', 1) AS int)
  ), 0) + 1
  INTO next_seq
  FROM public.accounts
  WHERE user_id = NEW.user_id
    AND code LIKE prefix || '-%/' || month_year;

  new_code := prefix || '-' || lpad(next_seq::text, 3, '0') || '/' || month_year;

  -- Defensive: if somehow exists, keep incrementing
  WHILE EXISTS (
    SELECT 1 FROM public.accounts
    WHERE user_id = NEW.user_id AND code = new_code
  ) LOOP
    next_seq := next_seq + 1;
    new_code := prefix || '-' || lpad(next_seq::text, 3, '0') || '/' || month_year;
  END LOOP;

  NEW.code := new_code;
  RETURN NEW;
END;
$function$;