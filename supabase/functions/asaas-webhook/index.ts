import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PAID_EVENTS = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH',
]);
const UNPAID_EVENTS = new Set([
  'PAYMENT_REFUNDED',
  'PAYMENT_DELETED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_REVERSED',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const received = req.headers.get('asaas-access-token');
    if (!expected || received !== expected) return json({ error: 'unauthorized' }, 401);

    const body = await req.json();
    const event: string = body?.event ?? '';
    const payment = body?.payment;
    if (!payment?.id) return json({ ok: true, ignored: true });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: charge } = await supabase
      .from('asaas_charges')
      .select('*')
      .eq('asaas_payment_id', payment.id)
      .maybeSingle();

    if (!charge) return json({ ok: true, unknown_charge: true });

    await supabase
      .from('asaas_charges')
      .update({
        status: payment.status ?? charge.status,
        net_value: payment.netValue ?? charge.net_value,
        invoice_url: payment.invoiceUrl ?? charge.invoice_url,
        bank_slip_url: payment.bankSlipUrl ?? charge.bank_slip_url,
        payment_date: payment.paymentDate ?? payment.confirmedDate ?? null,
        last_event: event,
        raw: payment,
      })
      .eq('id', charge.id);

    const accountIds: string[] = charge.account_ids?.length
      ? charge.account_ids
      : charge.account_id
        ? [charge.account_id]
        : [];

    if (PAID_EVENTS.has(event) && accountIds.length) {
      const paidAt = payment.paymentDate ? `${payment.paymentDate}T12:00:00Z` : new Date().toISOString();
      await supabase
        .from('accounts')
        .update({ status: 'paid', paid_at: paidAt })
        .eq('user_id', charge.user_id)
        .in('id', accountIds);

      const { data: accs } = await supabase
        .from('accounts')
        .select('id, amount')
        .eq('user_id', charge.user_id)
        .in('id', accountIds);

      if (accs?.length) {
        await supabase.from('payments').insert(
          accs.map((a) => ({
            user_id: charge.user_id,
            account_id: a.id,
            amount: a.amount,
            paid_at: paidAt,
            payment_method: charge.billing_type === 'PIX' ? 'pix' : 'boleto',
            notes: `Baixa automática Asaas (${event}) — cobrança ${payment.id}`,
          })),
        );
      }
    }

    if (UNPAID_EVENTS.has(event) && accountIds.length) {
      await supabase
        .from('accounts')
        .update({ status: 'pending', paid_at: null })
        .eq('user_id', charge.user_id)
        .in('id', accountIds);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('asaas-webhook error', e);
    return json({ error: 'internal' }, 500);
  }
});
