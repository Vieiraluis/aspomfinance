
-- Add code column to accounts
ALTER TABLE public.accounts ADD COLUMN code text UNIQUE;

-- Create function to generate sequential code
CREATE OR REPLACE FUNCTION public.generate_account_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prefix text;
  month_year text;
  next_seq int;
  new_code text;
BEGIN
  -- Determine prefix based on type
  IF NEW.type = 'payable' THEN
    prefix := 'PAG';
  ELSE
    prefix := 'REC';
  END IF;

  -- Get month/year from due_date
  month_year := to_char(NEW.due_date, 'MM/YYYY');

  -- Get next sequence number for this user, type and month/year
  SELECT COALESCE(MAX(
    CAST(split_part(split_part(code, '-', 2), '/', 1) AS int)
  ), 0) + 1
  INTO next_seq
  FROM public.accounts
  WHERE user_id = NEW.user_id
    AND type = NEW.type
    AND to_char(due_date, 'MM/YYYY') = month_year;

  -- Build code: PAG-001/04/2026 or REC-001/04/2026
  new_code := prefix || '-' || lpad(next_seq::text, 3, '0') || '/' || month_year;

  NEW.code := new_code;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER set_account_code
  BEFORE INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_account_code();

-- Generate codes for existing records
DO $$
DECLARE
  rec RECORD;
  prefix text;
  month_year text;
  next_seq int;
  new_code text;
BEGIN
  FOR rec IN
    SELECT id, user_id, type, due_date
    FROM public.accounts
    WHERE code IS NULL
    ORDER BY created_at
  LOOP
    IF rec.type = 'payable' THEN
      prefix := 'PAG';
    ELSE
      prefix := 'REC';
    END IF;

    month_year := to_char(rec.due_date, 'MM/YYYY');

    SELECT COALESCE(MAX(
      CAST(split_part(split_part(code, '-', 2), '/', 1) AS int)
    ), 0) + 1
    INTO next_seq
    FROM public.accounts
    WHERE user_id = rec.user_id
      AND type = rec.type
      AND to_char(due_date, 'MM/YYYY') = month_year
      AND code IS NOT NULL;

    new_code := prefix || '-' || lpad(next_seq::text, 3, '0') || '/' || month_year;

    UPDATE public.accounts SET code = new_code WHERE id = rec.id;
  END LOOP;
END;
$$;
