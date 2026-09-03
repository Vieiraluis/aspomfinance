export type SupplierType = 'supplier' | 'client';

export const supplierTypeLabels: Record<SupplierType, string> = {
  supplier: 'Fornecedor',
  client: 'Cliente',
};

export interface Supplier {
  id: string;
  name: string;
  document: string; // CPF ou CNPJ
  email: string;
  phone: string;
  address?: string;
  type: SupplierType;
  createdAt: Date;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'investment';
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date;
}

export type BankAccountType = BankAccount['type'];

export const bankAccountTypeLabels: Record<BankAccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  cash: 'Caixa',
  investment: 'Investimento',
};

export interface Account {
  id: string;
  code?: string;
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  supplierId?: string;
  supplierName?: string;
  category: string;
  installmentNumber?: number;
  totalInstallments?: number;
  parentId?: string; // For installments, reference to parent account
  paidAt?: Date;
  bankAccountId?: string; // Conta usada para baixa
  createdAt: Date;
  notes?: string;
  billingSlipUrl?: string; // Boleta de cobrança
  paymentReceiptUrl?: string; // Comprovante de pagamento
}

export interface Payment {
  id: string;
  accountId: string;
  amount: number;
  paidAt: Date;
  paymentMethod: 'cash' | 'transfer' | 'pix' | 'credit_card' | 'debit_card' | 'boleto';
  bankAccountId?: string;
  notes?: string;
}

export interface FinancialSummary {
  totalReceivable: number;
  totalPayable: number;
  overdueReceivable: number;
  overduePayable: number;
  paidThisMonth: number;
  receivedThisMonth: number;
  balance: number;
}

export type AccountCategory = 
  | 'rent'
  | 'energy'
  | 'water'
  | 'sewage'
  | 'natural_gas'
  | 'lpg_gas'
  | 'public_lighting'
  | 'waste_collection'
  | 'mineral_water'
  | 'internet'
  | 'telephony'
  | 'cable_tv'
  | 'telecom'
  | 'salary'
  | 'social_charges'
  | 'pro_labore'
  | 'thirteenth_salary'
  | 'vacation_pay'
  | 'vacation_bonus'
  | 'termination'
  | 'fgts'
  | 'inss_employer'
  | 'irrf_payroll'
  | 'union_fees'
  | 'overtime'
  | 'bonus_awards'
  | 'transport_voucher'
  | 'meal_voucher'
  | 'food_voucher'
  | 'health_plan'
  | 'dental_plan'
  | 'life_insurance'
  | 'occupational_health'
  | 'ppe_uniforms'
  | 'training'
  | 'interns_apprentices'
  | 'payroll_services'
  | 'office_supplies'
  | 'cleaning_supplies'
  | 'maintenance'
  | 'fuel'
  | 'food'
  | 'accounting'
  | 'insurance'
  | 'taxes'
  | 'marketing'
  | 'freight'
  | 'services'
  | 'sales'
  | 'commissions'
  | 'subscriptions'
  | 'equipment'
  | 'travel'
  | 'legal'
  | 'financial_fees'
  | 'bank_transfer'
  | 'bank_interest'
  | 'loan'
  | 'financing'
  | 'bank_charges'
  | 'check'
  | 'credit_card_interest'
  | 'bank_credit'
  | 'overdraft'
  | 'amortization'
  | 'guarantee'
  | 'discount_received'
  | 'interest_income'
  | 'other';

export const categoryLabels: Record<AccountCategory, string> = {
  rent: 'Aluguel',
  energy: 'Energia Elétrica (Concessionária)',
  water: 'Água (Concessionária)',
  sewage: 'Esgoto / Saneamento (Concessionária)',
  natural_gas: 'Gás Natural (Concessionária)',
  lpg_gas: 'Gás GLP / Botijão',
  public_lighting: 'Iluminação Pública (COSIP)',
  waste_collection: 'Coleta de Lixo / Resíduos',
  mineral_water: 'Água Mineral / Galões',
  internet: 'Internet / Banda Larga',
  telephony: 'Telefonia Fixa e Móvel',
  cable_tv: 'TV por Assinatura',
  telecom: 'Telecomunicações (Geral)',
  salary: 'Salários',
  social_charges: 'Encargos Sociais',
  pro_labore: 'Pró-labore',
  thirteenth_salary: '13º Salário',
  vacation_pay: 'Férias',
  vacation_bonus: 'Adicional de 1/3 de Férias',
  termination: 'Rescisões Trabalhistas',
  fgts: 'FGTS',
  inss_employer: 'INSS Patronal',
  irrf_payroll: 'IRRF sobre Folha',
  union_fees: 'Contribuições Sindicais',
  overtime: 'Horas Extras / Adicionais',
  bonus_awards: 'Bonificações e Prêmios',
  transport_voucher: 'Vale-Transporte',
  meal_voucher: 'Vale-Refeição',
  food_voucher: 'Vale-Alimentação',
  health_plan: 'Plano de Saúde',
  dental_plan: 'Plano Odontológico',
  life_insurance: 'Seguro de Vida',
  occupational_health: 'Medicina e Segurança do Trabalho',
  ppe_uniforms: 'EPIs e Uniformes',
  training: 'Treinamentos e Capacitação',
  interns_apprentices: 'Estagiários e Aprendizes',
  payroll_services: 'Serviços de Folha de Pagamento',
  office_supplies: 'Material de Escritório',
  cleaning_supplies: 'Material de Limpeza',
  maintenance: 'Manutenção',
  fuel: 'Combustível',
  food: 'Alimentação',
  accounting: 'Honorários Contábeis',
  insurance: 'Seguros',
  taxes: 'Impostos e Taxas',
  marketing: 'Marketing/Publicidade',
  freight: 'Frete/Transporte',
  services: 'Serviços Prestados',
  sales: 'Vendas',
  commissions: 'Comissões',
  subscriptions: 'Assinaturas/Mensalidades',
  equipment: 'Equipamentos',
  travel: 'Viagens/Deslocamentos',
  legal: 'Jurídico/Advocacia',
  financial_fees: 'Taxas Bancárias/Juros',
  bank_transfer: 'Transferência Bancária',
  bank_interest: 'Juros Bancários',
  loan: 'Empréstimos Bancários',
  financing: 'Financiamentos',
  bank_charges: 'Despesas Bancárias',
  check: 'Cheques',
  credit_card_interest: 'Juros Cartão de Crédito',
  bank_credit: 'Crédito Bancário',
  overdraft: 'Cheque Especial',
  amortization: 'Amortização de Empréstimos',
  guarantee: 'Garantias Bancárias',
  discount_received: 'Descontos Obtidos',
  interest_income: 'Rendimentos/Juros Recebidos',
  other: 'Outros',
};

/** Agrupamento por relatividade; itens ordenados alfabeticamente dentro de cada grupo. */
export const categoryGroupsRaw: { label: string; categories: AccountCategory[] }[] = [
  {
    label: 'Concessionárias e Utilidades',
    categories: [
      'water', 'mineral_water', 'waste_collection', 'energy', 'sewage',
      'natural_gas', 'lpg_gas', 'public_lighting', 'internet', 'telephony',
      'cable_tv', 'telecom',
    ],
  },
  {
    label: 'Despesas Administrativas',
    categories: [
      'rent', 'office_supplies', 'cleaning_supplies', 'maintenance', 'equipment',
      'subscriptions', 'insurance', 'freight', 'fuel', 'food', 'travel', 'marketing',
    ],
  },
  {
    label: 'Impostos, Taxas e Tarifas',
    categories: ['taxes', 'financial_fees'],
  },
  {
    label: 'Pessoal e Folha de Pagamento',
    categories: [
      'salary', 'pro_labore', 'thirteenth_salary', 'vacation_pay', 'vacation_bonus',
      'termination', 'overtime', 'bonus_awards', 'social_charges', 'fgts',
      'inss_employer', 'irrf_payroll', 'union_fees', 'transport_voucher',
      'meal_voucher', 'food_voucher', 'health_plan', 'dental_plan', 'life_insurance',
      'occupational_health', 'ppe_uniforms', 'training', 'interns_apprentices',
    ],
  },
  {
    label: 'Receitas',
    categories: ['sales', 'services', 'commissions'],
  },
  {
    label: 'Serviços Profissionais',
    categories: ['accounting', 'legal', 'payroll_services'],
  },
  {
    label: 'Outros',
    categories: ['other'],
  },
];

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

/** Grupos em ordem alfabética (exceto "Outros" ao final) com categorias ordenadas de A-Z. */
export const categoryGroups = categoryGroupsRaw
  .map((g) => ({
    label: g.label,
    categories: [...g.categories].sort((a, b) =>
      collator.compare(categoryLabels[a], categoryLabels[b])
    ),
  }))
  .sort((a, b) => {
    if (a.label === 'Outros') return 1;
    if (b.label === 'Outros') return -1;
    return collator.compare(a.label, b.label);
  });


export const paymentMethodLabels: Record<Payment['paymentMethod'], string> = {
  cash: 'Dinheiro',
  transfer: 'Transferência',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  boleto: 'Boleto',
};
