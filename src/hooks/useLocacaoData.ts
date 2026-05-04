import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EspacoLocacao {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  capacidade_maxima: number;
  preco_base: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocacaoReserva {
  id: string;
  user_id: string;
  event_id: string | null;
  espaco_id: string;
  cliente_nome: string;
  cliente_documento: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  tipo_evento: string | null;
  data_evento: string;
  turno: 'manha' | 'tarde' | 'noite';
  hora_inicio: string | null;
  hora_fim: string | null;
  total_lugares: number;
  valor_total: number;
  status: 'rascunho' | 'confirmada' | 'cancelada';
  contrato_modelo_url: string | null;
  contrato_assinado_url: string | null;
  protocolo: string | null;
  whatsapp_enviado_at: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEspacos() {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['espacos_locacao', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('espacos_locacao')
        .select('*')
        .order('nome');
      if (error) throw error;
      return (data || []) as EspacoLocacao[];
    },
  });
}

export function useUpsertEspaco() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<EspacoLocacao> & { nome: string }) => {
      if (!user) throw new Error('Não autenticado');
      const payload = { ...input, user_id: user.id };
      if (input.id) {
        const { error } = await supabase.from('espacos_locacao').update(payload).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('espacos_locacao').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['espacos_locacao'] });
      toast({ title: 'Espaço salvo' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteEspaco() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('espacos_locacao').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['espacos_locacao'] });
      toast({ title: 'Espaço removido' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useLocacoes() {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['locacao_reservas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacao_reservas')
        .select('*')
        .order('data_evento', { ascending: true });
      if (error) throw error;
      return (data || []) as LocacaoReserva[];
    },
  });
}

export function useUpsertLocacao() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<LocacaoReserva> & { espaco_id: string; cliente_nome: string; data_evento: string; turno: 'manha' | 'tarde' | 'noite' }) => {
      if (!user) throw new Error('Não autenticado');
      const payload = { ...input, user_id: user.id };
      if (input.id) {
        const { error } = await supabase.from('locacao_reservas').update(payload).eq('id', input.id);
        if (error) throw error;
        return input.id;
      } else {
        const { data, error } = await supabase.from('locacao_reservas').insert(payload).select('id').single();
        if (error) throw error;
        return data.id as string;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locacao_reservas'] });
      toast({ title: 'Reserva salva' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteLocacao() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locacao_reservas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locacao_reservas'] });
      toast({ title: 'Reserva removida' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useConfirmarLocacao() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locacao_reservas')
        .update({ status: 'confirmada' })
        .eq('id', id);
      if (error) throw error;

      // Tenta enviar WhatsApp; falha silenciosa se Twilio não configurado
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('send-whatsapp-ticket', {
          body: { reservaId: id },
        });
        if (fnErr) return { whatsapp: false, msg: fnErr.message };
        return { whatsapp: !!(data as any)?.success, msg: (data as any)?.error };
      } catch (e: any) {
        return { whatsapp: false, msg: e?.message };
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['locacao_reservas'] });
      if (res?.whatsapp) {
        toast({ title: 'Reserva confirmada', description: 'Ticket enviado por WhatsApp ✓' });
      } else {
        toast({ title: 'Reserva confirmada', description: res?.msg ? `WhatsApp: ${res.msg}` : 'WhatsApp não enviado.' });
      }
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useUploadContrato() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, file, kind }: { id: string; file: File; kind: 'modelo' | 'assinado' }) => {
      if (!user) throw new Error('Não autenticado');
      const path = `${user.id}/${id}/${kind}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('contracts').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('contracts').getPublicUrl(path);
      const field = kind === 'modelo' ? 'contrato_modelo_url' : 'contrato_assinado_url';
      const { error } = await supabase.from('locacao_reservas').update({ [field]: pub.publicUrl }).eq('id', id);
      if (error) throw error;
      return pub.publicUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locacao_reservas'] });
      toast({ title: 'Contrato enviado' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
