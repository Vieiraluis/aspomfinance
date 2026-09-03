import { Account, AccountCategory, categoryLabels } from '@/types/financial';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityConfig {
  level: PriorityLevel;
  label: string;
  description: string;
  /** Classes para tela e impressão (cores impressas com print-color-adjust). */
  headerClass: string;
  rowClass: string;
  badgeClass: string;
  hex: string;
}

export const priorityOrder: PriorityLevel[] = ['critical', 'high', 'medium', 'low'];

export const priorityConfig: Record<PriorityLevel, PriorityConfig> = {
  critical: {
    level: 'critical',
    label: 'Prioridade Crítica',
    description: 'Folha de pagamento, encargos e tributos — risco legal/trabalhista',
    headerClass: 'bg-[#fecaca] text-[#7f1d1d] border-[#ef4444]',
    rowClass: 'bg-[#fef2f2]',
    badgeClass: 'bg-[#ef4444] text-white',
    hex: '#ef4444',
  },
  high: {
    level: 'high',
    label: 'Prioridade Alta',
    description: 'Concessionárias, aluguel e obrigações bancárias — risco de corte/juros',
    headerClass: 'bg-[#fed7aa] text-[#7c2d12] border-[#f97316]',
    rowClass: 'bg-[#fff7ed]',
    badgeClass: 'bg-[#f97316] text-white',
    hex: '#f97316',
  },
  medium: {
    level: 'medium',
    label: 'Prioridade Média',
    description: 'Fornecedores, serviços e manutenção — negociáveis com prazo',
    headerClass: 'bg-[#bfdbfe] text-[#1e3a8a] border-[#3b82f6]',
    rowClass: 'bg-[#eff6ff]',
    badgeClass: 'bg-[#3b82f6] text-white',
    hex: '#3b82f6',
  },
  low: {
    level: 'low',
    label: 'Prioridade Baixa',
    description: 'Despesas adiáveis — assinaturas, marketing, viagens e afins',
    headerClass: 'bg-[#bbf7d0] text-[#14532d] border-[#22c55e]',
    rowClass: 'bg-[#f0fdf4]',
    badgeClass: 'bg-[#22c55e] text-white',
    hex: '#22c55e',
  },
};

const CRITICAL: AccountCategory[] = [
  'salary', 'pro_labore', 'thirteenth_salary', 'vacation_pay', 'vacation_bonus',
  'termination', 'overtime', 'social_charges', 'fgts', 'inss_employer',
  'irrf_payroll', 'union_fees', 'taxes', 'payroll_services',
];

const HIGH: AccountCategory[] = [
  'rent', 'energy', 'water', 'sewage', 'natural_gas', 'lpg_gas',
  'public_lighting', 'waste_collection', 'internet', 'telephony', 'telecom',
  'loan', 'financing', 'amortization', 'bank_charges', 'bank_interest',
  'credit_card_interest', 'overdraft', 'financial_fees', 'check',
  'transport_voucher', 'meal_voucher', 'food_voucher', 'health_plan',
];

const MEDIUM: AccountCategory[] = [
  'maintenance', 'services', 'accounting', 'legal', 'insurance', 'freight',
  'fuel', 'equipment', 'office_supplies', 'cleaning_supplies', 'mineral_water',
  'occupational_health', 'ppe_uniforms', 'dental_plan', 'life_insurance',
  'interns_apprentices', 'commissions', 'guarantee', 'bank_transfer',
];

/** Dias de atraso (0 quando ainda não venceu). */
export const daysOverdue = (account: Account): number => {
  const due = new Date(account.dueDate);
  due.setHours(12, 0, 0, 0);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
};

/**
 * Classifica o título por natureza da categoria e escala a prioridade
 * conforme o atraso (mais de 30 dias sobe um nível).
 */
export const getPriority = (account: Account): PriorityLevel => {
  const cat = account.category as AccountCategory;
  let base: PriorityLevel = CRITICAL.includes(cat)
    ? 'critical'
    : HIGH.includes(cat)
      ? 'high'
      : MEDIUM.includes(cat)
        ? 'medium'
        : 'low';

  if (daysOverdue(account) > 30) {
    const idx = priorityOrder.indexOf(base);
    base = priorityOrder[Math.max(0, idx - 1)];
  }
  return base;
};

export const categoryLabel = (category: string) =>
  categoryLabels[category as AccountCategory] || category || '-';
