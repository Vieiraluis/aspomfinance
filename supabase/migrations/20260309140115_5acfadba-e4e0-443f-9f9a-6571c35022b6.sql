
-- Employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text,
  name text NOT NULL,
  cpf text,
  rg text,
  birth_date date,
  phone text,
  email text,
  address_cep text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  admission_date date,
  salary numeric DEFAULT 0,
  position text,
  department text,
  bank_name text,
  bank_agency text,
  bank_account text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON public.employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.employees FOR DELETE USING (auth.uid() = user_id);

-- Employee absences table
CREATE TABLE public.employee_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  reason text,
  cid_code text,
  absence_type text NOT NULL DEFAULT 'medical',
  certificate_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own absences" ON public.employee_absences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own absences" ON public.employee_absences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own absences" ON public.employee_absences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own absences" ON public.employee_absences FOR DELETE USING (auth.uid() = user_id);

-- Employee exams table
CREATE TABLE public.employee_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  exam_type text NOT NULL,
  exam_date date NOT NULL,
  next_exam_date date,
  result text,
  file_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exams" ON public.employee_exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.employee_exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.employee_exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.employee_exams FOR DELETE USING (auth.uid() = user_id);

-- Employee benefits table
CREATE TABLE public.employee_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  benefit_type text NOT NULL,
  working_days integer NOT NULL DEFAULT 22,
  daily_cost numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  month_reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own benefits" ON public.employee_benefits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own benefits" ON public.employee_benefits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own benefits" ON public.employee_benefits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own benefits" ON public.employee_benefits FOR DELETE USING (auth.uid() = user_id);

-- Employee vacations table
CREATE TABLE public.employee_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  vacation_start date,
  vacation_end date,
  days integer NOT NULL DEFAULT 30,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_vacations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vacations" ON public.employee_vacations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vacations" ON public.employee_vacations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vacations" ON public.employee_vacations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vacations" ON public.employee_vacations FOR DELETE USING (auth.uid() = user_id);

-- Employee documents table (payslips, payment receipts)
CREATE TABLE public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'payslip',
  file_url text NOT NULL,
  reference_month text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.employee_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.employee_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.employee_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.employee_documents FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public) VALUES ('hr-documents', 'hr-documents', false);

-- Storage RLS policies for hr-documents bucket
CREATE POLICY "Users can upload own hr docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hr-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own hr docs" ON storage.objects FOR SELECT USING (bucket_id = 'hr-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own hr docs" ON storage.objects FOR DELETE USING (bucket_id = 'hr-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Updated_at trigger for employees
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
