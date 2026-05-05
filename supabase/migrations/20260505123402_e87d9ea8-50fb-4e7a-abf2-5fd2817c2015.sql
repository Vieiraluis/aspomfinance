ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_code_key;
ALTER TABLE public.accounts ADD CONSTRAINT accounts_user_code_key UNIQUE (user_id, code);