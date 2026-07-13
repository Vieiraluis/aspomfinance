/**
 * Utilitários para cálculos monetários seguros.
 *
 * Motivação: somar valores em ponto flutuante acumula erros de precisão
 * (ex.: 0.1 + 0.2 = 0.30000000000000004). Em relatórios financeiros isso
 * gera saldos como "R$ 1.234,56000000001" ou totais que fecham "por 1 centavo".
 *
 * Estratégia: converter cada valor para centavos (inteiros), somar em
 * inteiros e retornar o resultado em reais arredondado a 2 casas.
 */

/** Converte um valor em reais para centavos inteiros (arredondando). */
export function toCents(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  if (!Number.isFinite(n as number)) return 0;
  // Math.round evita erros como (1.005 * 100) === 100.49999999999999
  return Math.round((n as number) * 100);
}

/** Converte centavos inteiros para reais com 2 casas. */
export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/** Arredonda um valor monetário para 2 casas decimais de forma segura. */
export function roundMoney(value: number): number {
  return fromCents(toCents(value));
}

/**
 * Soma valores monetários com precisão de centavos.
 * Aceita array de números ou array de itens + função de acesso.
 */
export function sumMoney<T>(
  items: readonly T[] | readonly number[],
  getter?: (item: T) => number | string | null | undefined,
): number {
  let cents = 0;
  for (const item of items as readonly unknown[]) {
    const v = getter ? getter(item as T) : (item as number);
    cents += toCents(v as number);
  }
  return fromCents(cents);
}

/** Soma segura de dois valores monetários. */
export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/** Subtração segura de dois valores monetários. */
export function subMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}
