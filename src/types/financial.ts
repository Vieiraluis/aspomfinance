export interface Supplier {
  id: string;
  name: string;
  document: string; // CPF ou CNPJ
  email: string;
  phone: string;
  address?: string;
  createdAt: Date;
}

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
  createdAt: Date;
  notes?: string;
}

export interface Payment {
  id: string;
  accountId: string;
  amount: number;
  paidAt: Date;
  paymentMethod: 'cash' | 'transfer' | 'pix' | 'credit_card' | 'debit_card' | 'boleto';
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
  | 'utilities' 
  | 'rent' 
  | 'salary' 
  | 'supplies' 
  | 'services' 
  | 'taxes' 
  | 'sales' 
  | 'other';

export const categoryLabels: Record<AccountCategory, string> = {
  utilities: 'Utilidades',
  rent: 'Aluguel',
  salary: 'Salários',
  supplies: 'Suprimentos',
  services: 'Serviços',
  taxes: 'Impostos',
  sales: 'Vendas',
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
