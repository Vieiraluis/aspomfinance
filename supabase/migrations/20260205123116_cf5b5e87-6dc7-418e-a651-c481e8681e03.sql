-- Create table for receipt settings/customization
CREATE TABLE public.receipt_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT,
  company_address TEXT,
  company_document TEXT,
  company_phone TEXT,
  company_email TEXT,
  logo_url TEXT,
  header_text TEXT,
  footer_text TEXT,
  city TEXT DEFAULT 'Rio de Janeiro',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.receipt_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own receipt_settings" 
ON public.receipt_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipt_settings" 
ON public.receipt_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipt_settings" 
ON public.receipt_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_receipt_settings_updated_at
BEFORE UPDATE ON public.receipt_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();