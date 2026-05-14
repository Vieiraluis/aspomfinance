import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Associado } from '@/types/associados';

const KEY = ['associados'];

export function useAssociados() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('associados')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as Associado[];
    },
  });
}

export function useAddAssociado() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async (input: Partial<Associado>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('associados')
        .insert({ ...input, user_id: user.id, nome: input.nome || '' } as any)
        .select()
        .single();
      if (error) throw error;
      return data as Associado;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAssociado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Associado> & { id: string }) => {
      const { data, error } = await supabase
        .from('associados')
        .update(patch as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Associado;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAssociado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('associados').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['mensalidades'] });
    },
  });
}

export async function uploadAssociadoPhoto(file: File, userId: string) {
  const ext = file.name.split('.').pop() || 'png';
  const path = `associados/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return data.publicUrl;
}
