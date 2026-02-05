import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ReceiptSettings {
  id: string;
  user_id: string;
  company_name: string | null;
  company_address: string | null;
  company_document: string | null;
  company_phone: string | null;
  company_email: string | null;
  logo_url: string | null;
  header_text: string | null;
  footer_text: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export const useReceiptSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['receipt-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ReceiptSettings | null;
    },
    enabled: !!user,
  });

  const saveSettings = useMutation({
    mutationFn: async (newSettings: Partial<ReceiptSettings>) => {
      if (!user) throw new Error('User not authenticated');

      const { data: existing } = await supabase
        .from('receipt_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('receipt_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('receipt_settings')
          .insert({
            user_id: user.id,
            ...newSettings,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt-settings'] });
      toast({
        title: 'Configurações salvas!',
        description: 'As configurações do recibo foram atualizadas.',
      });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    saveSettings: saveSettings.mutate,
    isSaving: saveSettings.isPending,
  };
};
