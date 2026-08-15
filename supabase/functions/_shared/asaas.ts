// Cliente HTTP mínimo para a API do Asaas (produção)
export const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

export function asaasHeaders() {
  const key = Deno.env.get('ASAAS_API_KEY');
  if (!key) throw new Error('ASAAS_API_KEY não configurada');
  return {
    'Content-Type': 'application/json',
    access_token: key,
    'User-Agent': 'ASPOM-Financeiro',
  };
}

export async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: { ...asaasHeaders(), ...(init?.headers || {}) },
  });
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const msg = body?.errors?.map((e: any) => e.description).join(' | ') || `Asaas ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export const onlyDigits = (v?: string | null) => (v || '').replace(/\D/g, '');
