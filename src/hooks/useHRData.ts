import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// ============== EMPLOYEES ==============
export const useEmployees = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (employee: any) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('employees')
        .insert({ ...employee, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Funcionário cadastrado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao cadastrar funcionário', variant: 'destructive' });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('employees').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Funcionário atualizado com sucesso!' });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Funcionário removido com sucesso!' });
    },
  });
};

// ============== ABSENCES ==============
export const useEmployeeAbsences = (employeeId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employee_absences', employeeId],
    queryFn: async () => {
      if (!user || !employeeId) return [];
      const { data, error } = await supabase
        .from('employee_absences')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!employeeId,
  });
};

export const useAddAbsence = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (absence: any) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('employee_absences').insert({ ...absence, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_absences'] });
      toast({ title: 'Afastamento registrado!' });
    },
  });
};

export const useDeleteAbsence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_absences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_absences'] });
    },
  });
};

// ============== EXAMS ==============
export const useEmployeeExams = (employeeId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employee_exams', employeeId],
    queryFn: async () => {
      if (!user || !employeeId) return [];
      const { data, error } = await supabase
        .from('employee_exams')
        .select('*')
        .eq('employee_id', employeeId)
        .order('exam_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!employeeId,
  });
};

export const useAddExam = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (exam: any) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('employee_exams').insert({ ...exam, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_exams'] });
      toast({ title: 'Exame registrado!' });
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_exams'] });
    },
  });
};

// ============== BENEFITS ==============
export const useEmployeeBenefits = (employeeId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employee_benefits', employeeId],
    queryFn: async () => {
      if (!user || !employeeId) return [];
      const { data, error } = await supabase
        .from('employee_benefits')
        .select('*')
        .eq('employee_id', employeeId)
        .order('month_reference', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!employeeId,
  });
};

export const useAllBenefits = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['all_employee_benefits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('employee_benefits')
        .select('*, employees(name)')
        .eq('user_id', user.id)
        .order('month_reference', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useAddBenefit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (benefit: any) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('employee_benefits').insert({ ...benefit, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_benefits'] });
      queryClient.invalidateQueries({ queryKey: ['all_employee_benefits'] });
      toast({ title: 'Benefício registrado!' });
    },
  });
};

export const useDeleteBenefit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_benefits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_benefits'] });
      queryClient.invalidateQueries({ queryKey: ['all_employee_benefits'] });
    },
  });
};

// ============== VACATIONS ==============
export const useEmployeeVacations = (employeeId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employee_vacations', employeeId],
    queryFn: async () => {
      if (!user || !employeeId) return [];
      const { data, error } = await supabase
        .from('employee_vacations')
        .select('*')
        .eq('employee_id', employeeId)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!employeeId,
  });
};

export const useAddVacation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vacation: any) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('employee_vacations').insert({ ...vacation, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_vacations'] });
      toast({ title: 'Férias registradas!' });
    },
  });
};

export const useUpdateVacation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('employee_vacations').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_vacations'] });
    },
  });
};

export const useDeleteVacation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_vacations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_vacations'] });
    },
  });
};

// ============== DOCUMENTS ==============
export const useEmployeeDocuments = (employeeId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employee_documents', employeeId],
    queryFn: async () => {
      if (!user || !employeeId) return [];
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('reference_month', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!employeeId,
  });
};

export const useAddDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (doc: any) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('employee_documents').insert({ ...doc, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_documents'] });
      toast({ title: 'Documento adicionado!' });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_documents'] });
    },
  });
};

// ============== FILE UPLOAD ==============
export const useUploadHRFile = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      if (!user) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('hr-documents').upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('hr-documents').getPublicUrl(fileName);
      return urlData?.publicUrl || '';
    },
  });
};
