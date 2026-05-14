import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Associado, Mensalidade } from '@/types/associados';

const KEY = ['mensalidades'];

export function useMensalidades() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensalidades')
        .select('*')
        .order('vencimento', { ascending: false });
      if (error) throw error;
      return (data || []) as Mensalidade[];
    },
  });
}

export function useUpdateMensalidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Mensalidade> & { id: string }) => {
      const { data, error } = await supabase
        .from('mensalidades')
        .update(patch as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Mensalidade;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMensalidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mensalidades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Gera mensalidades de uma competência (MM/YYYY) para todos os associados ativos. Ignora duplicatas. */
export function useGerarMensalidadesMes() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async (competencia: string) => {
      if (!user) throw new Error('Não autenticado');
      const [mm, yyyy] = competencia.split('/').map(Number);
      if (!mm || !yyyy) throw new Error('Competência inválida');

      const { data: associados, error: e1 } = await supabase
        .from('associados')
        .select('*')
        .eq('status', 'ativo');
      if (e1) throw e1;

      const { data: existentes, error: e2 } = await supabase
        .from('mensalidades')
        .select('associado_id')
        .eq('competencia', competencia);
      if (e2) throw e2;
      const skipSet = new Set((existentes || []).map((m) => m.associado_id));

      const novos = (associados as Associado[])
        .filter((a) => !skipSet.has(a.id) && a.valor_mensalidade > 0)
        .map((a) => {
          const dia = Math.min(Math.max(a.dia_vencimento || 10, 1), 28);
          const venc = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          return {
            user_id: user.id,
            associado_id: a.id,
            competencia,
            valor: a.valor_mensalidade,
            vencimento: venc,
            status: 'pendente' as const,
          };
        });

      if (novos.length === 0) return { inserted: 0, skipped: skipSet.size };
      const { error } = await supabase.from('mensalidades').insert(novos);
      if (error) throw error;
      return { inserted: novos.length, skipped: skipSet.size };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
