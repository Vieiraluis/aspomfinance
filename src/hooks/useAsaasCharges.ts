import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface AsaasCharge {
  id: string;
  account_ids: string[];
  asaas_payment_id: string;
  billing_type: string;
  description: string | null;
  value: number;
  due_date: string;
  status: string;
  invoice_url: string | null;
  bank_slip_url: string | null;
  identification_field: string | null;
  pix_payload: string | null;
  pix_qr_image: string | null;
  payment_date: string | null;
  last_event: string | null;
  created_at: string;
}

export interface CreateAsaasChargeInput {
  accountIds: string[];
  billingType: 'BOLETO' | 'PIX' | 'UNDEFINED';
  dueDate: string;
  description?: string;
  juros: number;
  multa: number;
  notify: boolean;
  customer: {
    name: string;
    cpfCnpj: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export const useAsaasCharges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['asaas-charges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asaas_charges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as AsaasCharge[];
    },
    enabled: !!user,
  });
};

export const useCreateAsaasCharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAsaasChargeInput) => {
      const { data, error } = await supabase.functions.invoke('asaas-create-charge', {
        body: input,
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) {
        const err = (data as any).error;
        throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
      }
      return (data as any).charge as AsaasCharge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-charges'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: 'Cobrança registrada no Asaas',
        description: 'Boleto/Pix oficial gerado e enviado ao pagador.',
      });
    },
    onError: (e: Error) => {
      toast({ title: 'Erro ao registrar cobrança', description: e.message, variant: 'destructive' });
    },
  });
};
