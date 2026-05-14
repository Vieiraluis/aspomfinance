export type AssociadoStatus = 'ativo' | 'inativo' | 'suspenso';

export const associadoStatusLabels: Record<AssociadoStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  suspenso: 'Suspenso',
};

export const postoGraduacaoOptions = [
  'Sd PM',
  'Cb PM',
  '3º Sgt PM',
  '2º Sgt PM',
  '1º Sgt PM',
  'ST PM',
  'Asp Of PM',
  '2º Ten PM',
  '1º Ten PM',
  'Cap PM',
  'Maj PM',
  'TC PM',
  'Cel PM',
  'Pensionista',
  'Outro',
] as const;

export type PostoGraduacao = (typeof postoGraduacaoOptions)[number];

export interface Associado {
  id: string;
  user_id: string;
  photo_url?: string | null;
  nome: string;
  cpf?: string | null;
  rg_pmerj?: string | null;
  identidade?: string | null;
  posto_graduacao?: string | null;
  matricula_associacao?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco_cep?: string | null;
  endereco_rua?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  pix_chave?: string | null;
  valor_mensalidade: number;
  data_adesao?: string | null;
  dia_vencimento: number;
  status: AssociadoStatus;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export type MensalidadeStatus = 'pendente' | 'pago' | 'atrasado';

export const mensalidadeStatusLabels: Record<MensalidadeStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
};

export interface Mensalidade {
  id: string;
  user_id: string;
  associado_id: string;
  competencia: string; // MM/YYYY
  valor: number;
  vencimento: string; // YYYY-MM-DD
  pago_em?: string | null;
  status: MensalidadeStatus;
  forma_pagamento?: string | null;
  bank_account_id?: string | null;
  linha_digitavel?: string | null;
  pix_payload?: string | null;
  pix_txid?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MensalidadeWithAssociado extends Mensalidade {
  associado?: Associado;
}
