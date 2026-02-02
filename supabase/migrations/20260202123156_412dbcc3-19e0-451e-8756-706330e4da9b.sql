-- Create table for tracking receipt numbers per month
CREATE TABLE public.receipt_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year_month TEXT NOT NULL, -- Format: YYYYMM (e.g., 202601)
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- Enable RLS
ALTER TABLE public.receipt_numbers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own receipt_numbers" 
ON public.receipt_numbers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipt_numbers" 
ON public.receipt_numbers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipt_numbers" 
ON public.receipt_numbers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create table for storing generated receipts
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  receipt_number TEXT NOT NULL, -- Format: NNMMYY (e.g., 0101126 = receipt 01, month 01, year 26)
  year_month TEXT NOT NULL, -- Format: YYYYMM for grouping
  sequence_number INTEGER NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_document TEXT,
  amount NUMERIC NOT NULL,
  amount_written TEXT NOT NULL, -- Value written in full
  reference TEXT NOT NULL, -- What the receipt refers to
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own receipts" 
ON public.receipts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts" 
ON public.receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts" 
ON public.receipts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_receipt_numbers_updated_at
BEFORE UPDATE ON public.receipt_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();