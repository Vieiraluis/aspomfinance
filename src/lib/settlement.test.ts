import { describe, expect, it } from 'vitest';
import { cleanReceiptDescription, settlementTotals, validateSettlement } from './settlement';

describe('adjusted settlement', () => {
  const part = (amount: number) => ({ amount, paymentMethod: 'pix', bankAccountId: 'bank' });
  it('calculates a partial installment with interest and discount in cents', () => {
    expect(settlementTotals(60.1, 2.2, 1.3, 100.2)).toEqual({ net: 61, remaining: 40.1 });
    expect(validateSettlement(60.1, 2.2, 1.3, 100.2, [part(20), part(41)])).toBeNull();
  });
  it('accepts full settlement split between two methods', () => {
    expect(validateSettlement(100, 5, 10, 100, [part(30), part(65)])).toBeNull();
  });
  it('rejects overpayment, mismatching splits and invalid adjustments', () => {
    expect(validateSettlement(101, 0, 0, 100, [part(101)])).toBeTruthy();
    expect(validateSettlement(100, 0, 0, 100, [part(99)])).toBeTruthy();
    expect(validateSettlement(100, 0, 100, 100, [part(0)])).toBeTruthy();
    expect(validateSettlement(100, -1, 0, 100, [part(99)])).toBeTruthy();
  });
  it('removes only automatic installment text from receipt descriptions', () => {
    expect(cleanReceiptDescription('Mensalidade (2/3)')).toBe('Mensalidade');
    expect(cleanReceiptDescription('Serviço — parcelas CR-000001, CR-000002')).toBe('Serviço');
    expect(cleanReceiptDescription('Serviço (especial)')).toBe('Serviço (especial)');
  });
});