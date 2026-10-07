import { addMoney, subMoney, sumMoney, toCents } from '@/lib/money';

export interface SettlementPart {
  amount: number;
  paymentMethod: string;
  bankAccountId: string;
}

export function settlementTotals(principal: number, interest: number, discount: number, available: number) {
  return {
    net: subMoney(addMoney(principal, interest), discount),
    remaining: subMoney(available, principal),
  };
}

export function validateSettlement(principal: number, interest: number, discount: number, available: number, parts: SettlementPart[]) {
  if (![principal, interest, discount, available, ...parts.map(p => p.amount)].every(Number.isFinite)) return 'Informe valores válidos.';
  if (toCents(principal) <= 0 || toCents(principal) > toCents(available)) return 'O valor da baixa deve ser maior que zero e não ultrapassar o saldo selecionado.';
  if (interest < 0 || discount < 0) return 'Juros e descontos não podem ser negativos.';
  const { net } = settlementTotals(principal, interest, discount, available);
  if (toCents(net) <= 0) return 'O valor líquido deve ser maior que zero.';
  if (parts.length < 1 || parts.length > 2 || parts.some(p => !p.bankAccountId || !p.paymentMethod || toCents(p.amount) <= 0)) return 'Preencha a conta, forma e valor de cada pagamento.';
  if (toCents(sumMoney(parts, p => p.amount)) !== toCents(net)) return 'A soma das formas deve corresponder ao valor líquido.';
  return null;
}

export const cleanReceiptDescription = (description: string) => description.replace(/\s*\(\d+\/\d+\)(?:\s*-\s*saldo)?\s*$/, '').replace(/\s*—\s*parcelas\b.*$/i, '').trim();