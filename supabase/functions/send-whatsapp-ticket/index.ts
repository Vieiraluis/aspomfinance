import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { reservaId } = await req.json();
    if (!reservaId) {
      return new Response(JSON.stringify({ error: 'reservaId obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: reserva, error: rErr } = await supabase
      .from('locacao_reservas')
      .select('*, espacos_locacao(nome)')
      .eq('id', reservaId)
      .single();
    if (rErr || !reserva) {
      return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!reserva.cliente_telefone) {
      return new Response(JSON.stringify({ error: 'Cliente sem telefone cadastrado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    const TWILIO_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM'); // ex: whatsapp:+14155238886

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return new Response(JSON.stringify({
        error: 'Twilio não configurado. Conecte a integração Twilio e configure TWILIO_WHATSAPP_FROM.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const turnoLabel = reserva.turno === 'manha' ? 'Manhã' : reserva.turno === 'tarde' ? 'Tarde' : 'Noite';
    const dataFmt = new Date(reserva.data_evento + 'T12:00:00').toLocaleDateString('pt-BR');
    const espacoNome = (reserva as any).espacos_locacao?.nome ?? 'Espaço';

    const body = `🎟️ *TICKET DIGITAL - CONFIRMAÇÃO DE RESERVA*\n\n` +
      `Olá, *${reserva.cliente_nome}*!\n` +
      `Sua reserva foi confirmada.\n\n` +
      `📌 *Evento:* ${reserva.tipo_evento || 'Evento'}\n` +
      `📅 *Data:* ${dataFmt}\n` +
      `🕒 *Turno:* ${turnoLabel}\n` +
      `📍 *Espaço:* ${espacoNome}\n` +
      `🔢 *Protocolo:* ${reserva.protocolo}\n\n` +
      `Apresente este protocolo no dia do evento.`;

    let toPhone = reserva.cliente_telefone.replace(/\D/g, '');
    if (!toPhone.startsWith('55')) toPhone = '55' + toPhone;
    const To = `whatsapp:+${toPhone}`;

    const resp = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To, From: TWILIO_FROM, Body: body }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `Twilio [${resp.status}]: ${JSON.stringify(data)}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('locacao_reservas').update({ whatsapp_enviado_at: new Date().toISOString() }).eq('id', reservaId);

    return new Response(JSON.stringify({ success: true, sid: data.sid, protocolo: reserva.protocolo }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
