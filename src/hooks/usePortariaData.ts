import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { normalizeStorageUrl } from '@/lib/storageUrl';

// ============== LOCAIS (Salas e Departamentos) ==============
export const usePortariaLocais = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['portaria_locais', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('portaria_locais')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useSaveLocal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      if (!user) throw new Error('Not authenticated');
      if (id) {
        const { error } = await supabase.from('portaria_locais').update(values).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portaria_locais')
          .insert({ ...values, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portaria_locais'] });
      toast({ title: 'Destino salvo com sucesso!' });
    },
    onError: (e: any) =>
      toast({ title: 'Erro ao salvar destino', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteLocal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('portaria_locais').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portaria_locais'] });
      toast({ title: 'Destino removido.' });
    },
  });
};

// ============== PLANTÕES ==============
export const usePlantoes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['portaria_plantoes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('portaria_plantoes')
        .select('*, employees(id, name, photo_url, position)')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .order('hora_inicio');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useSavePlantao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      if (!user) throw new Error('Not authenticated');
      if (id) {
        const { error } = await supabase.from('portaria_plantoes').update(values).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portaria_plantoes')
          .insert({ ...values, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portaria_plantoes'] });
      toast({ title: 'Plantão salvo com sucesso!' });
    },
    onError: (e: any) =>
      toast({ title: 'Erro ao salvar plantão', description: e.message, variant: 'destructive' }),
  });
};

export const useDeletePlantao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('portaria_plantoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portaria_plantoes'] });
      toast({ title: 'Plantão removido.' });
    },
  });
};

/** Plantão que cobre o instante informado (data + faixa de horário). */
export const usePlantaoAtual = (now: Date = new Date()) => {
  const { data: plantoes = [], isLoading } = usePlantoes();
  const dia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const atual = plantoes.find((p: any) => {
    if (p.data !== dia) return false;
    const inicio = String(p.hora_inicio).slice(0, 5);
    const fim = String(p.hora_fim).slice(0, 5);
    // Plantão que vira o dia (ex.: 22:00 -> 06:00)
    if (fim <= inicio) return hora >= inicio || hora < fim;
    return hora >= inicio && hora < fim;
  });

  return { plantao: atual, isLoading };
};

// ============== VISITAS ==============
export const useVisitas = (filters?: { onlyActive?: boolean; start?: Date; end?: Date }) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [
      'portaria_visitas',
      user?.id,
      filters?.onlyActive,
      filters?.start?.toISOString(),
      filters?.end?.toISOString(),
    ],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('portaria_visitas')
        .select('*, portaria_locais(id, nome), employees(id, name, photo_url)')
        .eq('user_id', user.id)
        .order('entrada_at', { ascending: false });

      if (filters?.onlyActive) query = query.is('saida_at', null);
      if (filters?.start) query = query.gte('entrada_at', filters.start.toISOString());
      if (filters?.end) query = query.lte('entrada_at', filters.end.toISOString());

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useRegistrarEntrada = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: any) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('portaria_visitas').insert({
        ...values,
        user_id: user.id,
        registrado_por: user.id,
        entrada_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portaria_visitas'] });
      toast({ title: 'Entrada registrada!' });
    },
    onError: (e: any) =>
      toast({ title: 'Erro ao registrar entrada', description: e.message, variant: 'destructive' }),
  });
};

export const useRegistrarSaida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('portaria_visitas')
        .update({ saida_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portaria_visitas'] });
      toast({ title: 'Saída registrada!' });
    },
    onError: (e: any) =>
      toast({ title: 'Erro ao registrar saída', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteVisita = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('portaria_visitas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portaria_visitas'] });
      toast({ title: 'Registro removido.' });
    },
  });
};

/** Envia a foto do visitante para o storage privado e devolve a URL estável. */
export const uploadVisitorPhoto = async (userId: string, blob: Blob, ext = 'jpg') => {
  const fileName = `${userId}/portaria_${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(fileName, blob, { cacheControl: '3600', upsert: false, contentType: blob.type || 'image/jpeg' });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(data.path);
  return normalizeStorageUrl(publicUrlData.publicUrl);
};
