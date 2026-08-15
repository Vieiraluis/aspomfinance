import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';
import { asaasFetch, onlyDigits } from '../_shared/asaas.ts';

const BodySchema = z.object({
  accountIds: z.array(z.string().uuid()).min(1).max(50),
  billingType: z.enum(['BOLETO', 'PIX', 'UNDEFINED']).default('BOLETO'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(500).optional(),
  juros: z.number().min(0).max(20).default(1),
  multa: z.number().min(0).max(20).default(2),
  notify: z.boolean().default(true),
  customer: z.object({
    name: z.string().min(2).max(120),
    cpfCnpj: z.string().min(11).max(20),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    address: z.string().max(200).optional().or(z.literal('')),
  }),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userErr || !userData.user) return json({ error: 'Não autenticado' }, 401);
    const userId = userData.user.id;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const b = parsed.data;

    // Confere se os lançamentos pertencem ao usuário e soma o valor real no servidor
    const { data: accounts, error: accErr } = await supabase
      .from('accounts')
      .select('id, amount, description, code, type, status')
      .eq('user_id', userId)
      .in('id', b.accountIds);
    if (accErr) throw accErr;
    if (!accounts || accounts.length !== b.accountIds.length)
      return json({ error: 'Lançamentos inválidos' }, 400);
    if (accounts.some((a) => a.type !== 'receivable'))
      return json({ error: 'Somente contas a receber podem ser cobradas' }, 400);

    const centavos = accounts.reduce((s, a) => s + Math.round(Number(a.amount) * 100), 0);
    const value = centavos / 100;
    if (value <= 0) return json({ error: 'Valor total inválido' }, 400);

    const cpfCnpj = onlyDigits(b.customer.cpfCnpj);
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)
      return json({ error: 'CPF/CNPJ do pagador inválido' }, 400);

    // 1) Cliente no Asaas (reaproveita se já existir)
    const found = await asaasFetch<{ data: Array<{ id: string }> }>(
      `/customers?cpfCnpj=${cpfCnpj}&limit=1`,
    );
    let customerId = found.data?.[0]?.id;
    if (!customerId) {
      const created = await asaasFetch<{ id: string }>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: b.customer.name,
          cpfCnpj,
          email: b.customer.email || undefined,
          mobilePhone: onlyDigits(b.customer.phone) || undefined,
          address: b.customer.address || undefined,
          notificationDisabled: !b.notify,
        }),
      });
      customerId = created.id;
    }

    const description =
      b.description ||
      accounts.map((a) => `${a.code ? a.code + ' — ' : ''}${a.description}`).join(' | ').slice(0, 490);

    // 2) Cobrança
    const payment = await asaasFetch<any>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: b.billingType,
        value,
        dueDate: b.dueDate,
        description,
        externalReference: b.accountIds.join(','),
        interest: { value: b.juros },
        fine: { value: b.multa },
      }),
    });

    // 3) Linha digitável e QR Pix
    let identificationField: string | null = null;
    let pixPayload: string | null = null;
    let pixQr: string | null = null;
    try {
      if (b.billingType !== 'PIX') {
        const idf = await asaasFetch<any>(`/payments/${payment.id}/identificationField`);
        identificationField = idf.identificationField ?? null;
      }
    } catch (_) { /* boleto ainda em geração */ }
    try {
      const qr = await asaasFetch<any>(`/payments/${payment.id}/pixQrCode`);
      pixPayload = qr.payload ?? null;
      pixQr = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null;
    } catch (_) { /* pix indisponível para esta cobrança */ }

    // 4) Envio pelo Asaas (e-mail/SMS/WhatsApp conforme configurado na conta)
    if (b.notify) {
      try {
        await asaasFetch(`/payments/${payment.id}/notifications`, { method: 'GET' });
        if (b.customer.email) {
          await asaasFetch(`/payments/${payment.id}/billingInfo/send`, { method: 'POST' }).catch(() => {});
        }
      } catch (_) { /* notificações padrão do Asaas já são disparadas na criação */ }
    }

    const { data: charge, error: insErr } = await supabase
      .from('asaas_charges')
      .insert({
        user_id: userId,
        account_id: b.accountIds[0],
        account_ids: b.accountIds,
        asaas_customer_id: customerId,
        asaas_payment_id: payment.id,
        billing_type: b.billingType,
        description,
        value,
        net_value: payment.netValue ?? null,
        due_date: b.dueDate,
        status: payment.status ?? 'PENDING',
        invoice_url: payment.invoiceUrl ?? null,
        bank_slip_url: payment.bankSlipUrl ?? null,
        identification_field: identificationField,
        pix_payload: pixPayload,
        pix_qr_image: pixQr,
        raw: payment,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return json({ charge });
  } catch (e) {
    console.error('asaas-create-charge error', e);
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado' }, 500);
  }
});
