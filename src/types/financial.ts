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
  | 'telecom'
  | 'salary'
  | 'social_charges'
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
  | 'other';

export const categoryLabels: Record<AccountCategory, string> = {
  rent: 'Aluguel',
  energy: 'Energia Elétrica',
  water: 'Água e Esgoto',
  telecom: 'Telefone/Internet',
  salary: 'Salários',
  social_charges: 'Encargos Sociais',
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
  other: 'Outros',
};

export const paymentMethodLabels: Record<Payment['paymentMethod'], string> = {
  cash: 'Dinheiro',
  transfer: 'Transferência',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  boleto: 'Boleto',
};
