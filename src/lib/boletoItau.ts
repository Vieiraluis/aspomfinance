// Geração de dados de boleto bancário — Banco Itaú (341), carteira 109
// Cálculo FEBRABAN: código de barras 44 posições, linha digitável e barras I2of5.

export const ITAU_BENEFICIARIO = {
  nome: 'Associação Beneficente dos Subtenentes e Sargentos da Policia Militar - ASPOM',
  nomeCurto: 'ASPOM',
  cnpj: '33.773.995/0001-82',
  banco: 'Itaú',
  bancoCodigo: '341',
  bancoDv: '7',
  agencia: '5646',
  conta: '01576',
  contaDv: '7',
  carteira: '109',
};

const onlyDigits = (v: string) => v.replace(/\D/g, '');

export function modulo10(num: string): number {
  const digits = onlyDigits(num).split('').reverse();
  let sum = 0;
  digits.forEach((d, i) => {
    let v = Number(d) * (i % 2 === 0 ? 2 : 1);
    if (v > 9) v -= 9;
    sum += v;
  });
  const rest = sum % 10;
  return rest === 0 ? 0 : 10 - rest;
}

export function modulo11Barra(num: string): number {
  const digits = onlyDigits(num).split('').reverse();
  let sum = 0;
  let weight = 2;
  for (const d of digits) {
    sum += Number(d) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  const dv = 11 - rest;
  if (dv === 0 || dv === 1 || dv > 9) return 1;
  return dv;
}

/** Fator de vencimento FEBRABAN (base 07/10/1997, reciclagem a cada 9000 dias) */
export function fatorVencimento(due: Date): string {
  const base = Date.UTC(1997, 9, 7);
  const d = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  let days = Math.round((d - base) / 86400000);
  while (days > 9999) days -= 9000;
  if (days < 0) days = 0;
  return String(days).padStart(4, '0');
}

export interface BoletoNumbers {
  barcode: string; // 44 dígitos
  linhaDigitavel: string; // formatada
  linhaDigitavelRaw: string; // 47 dígitos
  nossoNumeroFormatado: string; // 109/00000001-D
  agenciaConta: string; // 5646 / 01576-7
}

export interface BoletoNumbersParams {
  nossoNumero: string | number; // até 8 dígitos
  valor: number;
  vencimento: Date;
}

export function buildBoletoItau({ nossoNumero, valor, vencimento }: BoletoNumbersParams): BoletoNumbers {
  const { bancoCodigo, agencia, conta, contaDv, carteira } = ITAU_BENEFICIARIO;
  const nn = onlyDigits(String(nossoNumero)).padStart(8, '0').slice(-8);

  // DAC do nosso número (agência + conta + carteira + nosso número) — módulo 10
  const dacNN = modulo10(`${agencia}${conta}${carteira}${nn}`);
  // DAC agência/conta — módulo 10
  const dacAgConta = modulo10(`${agencia}${conta}`);

  const campoLivre = `${carteira}${nn}${dacNN}${agencia}${conta}${dacAgConta}000`; // 25 dígitos
  const valorStr = String(Math.round(valor * 100)).padStart(10, '0');
  const fator = fatorVencimento(vencimento);

  const semDv = `${bancoCodigo}9${fator}${valorStr}${campoLivre}`; // 43 dígitos
  const dvGeral = modulo11Barra(`${semDv.slice(0, 4)}${semDv.slice(4)}`);
  const barcode = `${bancoCodigo}9${dvGeral}${fator}${valorStr}${campoLivre}`;

  // Linha digitável
  const c1 = `${bancoCodigo}9${campoLivre.slice(0, 5)}`;
  const c1dv = modulo10(c1);
  const c2 = campoLivre.slice(5, 15);
  const c2dv = modulo10(c2);
  const c3 = campoLivre.slice(15, 25);
  const c3dv = modulo10(c3);
  const c4 = String(dvGeral);
  const c5 = `${fator}${valorStr}`;

  const raw = `${c1}${c1dv}${c2}${c2dv}${c3}${c3dv}${c4}${c5}`;
  const linhaDigitavel = `${c1.slice(0, 5)}.${c1.slice(5)}${c1dv} ${c2.slice(0, 5)}.${c2.slice(5)}${c2dv} ${c3.slice(0, 5)}.${c3.slice(5)}${c3dv} ${c4} ${c5}`;

  return {
    barcode,
    linhaDigitavel,
    linhaDigitavelRaw: raw,
    nossoNumeroFormatado: `${carteira}/${nn}-${dacNN}`,
    agenciaConta: `${agencia} / ${conta}-${contaDv}`,
  };
}

/** Interleaved 2 of 5 — retorna larguras (1 = fina, 3 = larga) alternando preto/branco */
export function barsInterleaved2of5(code: string): { width: number; black: boolean }[] {
  const patterns: Record<string, string> = {
    '0': 'nnwwn', '1': 'wnnnw', '2': 'nwnnw', '3': 'wwnnn', '4': 'nnwnw',
    '5': 'wnwnn', '6': 'nwwnn', '7': 'nnnww', '8': 'wnnwn', '9': 'nwnwn',
  };
  let digits = onlyDigits(code);
  if (digits.length % 2 !== 0) digits = '0' + digits;

  const bars: { width: number; black: boolean }[] = [];
  // start: nnnn
  bars.push({ width: 1, black: true }, { width: 1, black: false }, { width: 1, black: true }, { width: 1, black: false });

  for (let i = 0; i < digits.length; i += 2) {
    const p1 = patterns[digits[i]];
    const p2 = patterns[digits[i + 1]];
    for (let j = 0; j < 5; j++) {
      bars.push({ width: p1[j] === 'w' ? 3 : 1, black: true });
      bars.push({ width: p2[j] === 'w' ? 3 : 1, black: false });
    }
  }
  // stop: wnn
  bars.push({ width: 3, black: true }, { width: 1, black: false }, { width: 1, black: true });
  return bars;
}

/** Nosso número determinístico a partir de um identificador */
export function nossoNumeroFromSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 99999999;
  return String(h).padStart(8, '0');
}
