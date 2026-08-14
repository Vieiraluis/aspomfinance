import { forwardRef } from 'react';
import aspomLogo from '@/assets/aspom-logo.png';
import { ITAU_BENEFICIARIO, BoletoNumbers } from '@/lib/boletoItau';
import { BoletoBarcode } from './BoletoBarcode';
import { formatCurrency, formatDate } from '@/lib/format';

export interface BoletoItem {
  id: string;
  descricao: string;
  vencimento: Date;
  valor: number;
  codigo?: string;
}

export interface BoletoData {
  numbers: BoletoNumbers;
  pagadorNome: string;
  pagadorDocumento?: string;
  pagadorEndereco?: string;
  vencimento: Date;
  total: number;
  itens: BoletoItem[];
  descricao: string;
  documento: string;
  juros: number; // % ao mês
  multa: number; // %
  instrucoesExtras?: string;
  pixCode: string;
  pixQr?: string;
}

const Field = ({
  label,
  value,
  className = '',
  strong = false,
  align = 'left',
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  strong?: boolean;
  align?: 'left' | 'right';
}) => (
  <div className={`border-l border-gray-400 first:border-l-0 px-2 py-1 ${className}`}>
    <p className="text-[7px] uppercase tracking-wide text-gray-600 leading-none mb-1">{label}</p>
    <p
      className={`leading-tight ${strong ? 'text-[11px] font-bold' : 'text-[9px]'} ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {value || '\u00A0'}
    </p>
  </div>
);

const BankHeader = ({ title }: { title: string }) => (
  <div className="flex items-end gap-2 border-b-2 border-black pb-1">
    <img src={aspomLogo} alt="Logotipo ASPOM" className="h-9 w-auto object-contain" />
    <div className="flex items-end gap-2 flex-1 border-l border-gray-400 pl-2">
      <span className="text-[15px] font-extrabold tracking-tight">
        {ITAU_BENEFICIARIO.bancoCodigo}-{ITAU_BENEFICIARIO.bancoDv}
      </span>
      <span className="text-[9px] text-gray-600 pb-[2px]">Banco {ITAU_BENEFICIARIO.banco}</span>
    </div>
    <span className="text-[8px] uppercase tracking-widest text-gray-600">{title}</span>
  </div>
);

export const BoletoDocument = forwardRef<HTMLDivElement, { data: BoletoData }>(({ data }, ref) => {
  const b = ITAU_BENEFICIARIO;
  const {
    numbers,
    pagadorNome,
    pagadorDocumento,
    pagadorEndereco,
    vencimento,
    total,
    itens,
    descricao,
    documento,
    juros,
    multa,
    instrucoesExtras,
    pixCode,
    pixQr,
  } = data;

  return (
    <div
      ref={ref}
      className="boleto-sheet bg-white text-black mx-auto w-full max-w-[820px] p-5 font-sans"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* ================= RECIBO DO PAGADOR ================= */}
      <section className="mb-3">
        <BankHeader title="Recibo do Pagador" />
        <div className="border border-gray-400 border-t-0">
          <div className="grid grid-cols-[1fr_150px] border-b border-gray-400">
            <Field label="Beneficiário" value={`${b.nome} — CNPJ ${b.cnpj}`} />
            <Field label="Agência / Código do Beneficiário" value={numbers.agenciaConta} />
          </div>
          <div className="grid grid-cols-4 border-b border-gray-400">
            <Field label="Nosso Número" value={numbers.nossoNumeroFormatado} />
            <Field label="Documento" value={documento} />
            <Field label="Vencimento" value={formatDate(vencimento)} strong />
            <Field label="Valor do Documento" value={formatCurrency(total)} strong align="right" />
          </div>
          <div className="grid grid-cols-[1fr_150px] border-b border-gray-400">
            <Field label="Pagador" value={`${pagadorNome}${pagadorDocumento ? ` — ${pagadorDocumento}` : ''}`} />
            <Field label="Qtd. Lançamentos" value={String(itens.length)} />
          </div>

          {/* Detalhamento dos lançamentos */}
          <div className="px-2 py-1">
            <p className="text-[7px] uppercase tracking-wide text-gray-600 mb-1">Demonstrativo / Histórico</p>
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-gray-300 text-gray-600">
                  <th className="text-left font-semibold py-[2px]">Vencimento</th>
                  <th className="text-left font-semibold">Documento</th>
                  <th className="text-left font-semibold">Descrição</th>
                  <th className="text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => (
                  <tr key={i.id} className="border-b border-gray-200 last:border-0">
                    <td className="py-[2px]">{formatDate(i.vencimento)}</td>
                    <td>{i.codigo || '—'}</td>
                    <td className="pr-2">{i.descricao}</td>
                    <td className="text-right tabular-nums">{formatCurrency(i.valor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-400">
                  <td colSpan={3} className="text-right font-bold py-[3px]">
                    Total
                  </td>
                  <td className="text-right font-bold tabular-nums">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* linha de corte */}
      <div className="flex items-center gap-2 my-3 text-[7px] text-gray-500 uppercase tracking-widest">
        <span className="flex-1 border-t border-dashed border-gray-400" />
        corte aqui
        <span className="flex-1 border-t border-dashed border-gray-400" />
      </div>

      {/* ================= FICHA DE COMPENSAÇÃO ================= */}
      <section>
        <BankHeader title="Ficha de Compensação" />
        <div className="border-b-2 border-black py-1">
          <p className="text-[13px] font-bold tracking-[0.02em] text-center tabular-nums">
            {numbers.linhaDigitavel}
          </p>
        </div>

        <div className="border border-gray-400 border-t-0">
          <div className="grid grid-cols-[1fr_150px] border-b border-gray-400">
            <Field label="Local de Pagamento" value="Pagável em qualquer banco, lotérica ou aplicativo até o vencimento. Após o vencimento, pague pelo PIX." />
            <Field label="Vencimento" value={formatDate(vencimento)} strong align="right" />
          </div>
          <div className="grid grid-cols-[1fr_150px] border-b border-gray-400">
            <Field label="Beneficiário" value={`${b.nome} — CNPJ ${b.cnpj}`} />
            <Field label="Agência / Código do Beneficiário" value={numbers.agenciaConta} align="right" />
          </div>
          <div className="grid grid-cols-[repeat(5,1fr)_150px] border-b border-gray-400">
            <Field label="Data do Documento" value={formatDate(new Date())} />
            <Field label="Nº do Documento" value={documento} />
            <Field label="Espécie Doc." value="DM" />
            <Field label="Aceite" value="N" />
            <Field label="Data Processamento" value={formatDate(new Date())} />
            <Field label="Nosso Número" value={numbers.nossoNumeroFormatado} align="right" />
          </div>
          <div className="grid grid-cols-[repeat(5,1fr)_150px] border-b border-gray-400">
            <Field label="Uso do Banco" value="" />
            <Field label="Carteira" value={b.carteira} />
            <Field label="Espécie" value="R$" />
            <Field label="Quantidade" value={String(itens.length)} />
            <Field label="Valor" value="" />
            <Field label="(=) Valor do Documento" value={formatCurrency(total)} strong align="right" />
          </div>

          {/* Instruções + QR Pix */}
          <div className="grid grid-cols-[1fr_150px] border-b border-gray-400">
            <div className="grid grid-cols-[1fr_170px]">
              <div className="px-2 py-1">
                <p className="text-[7px] uppercase tracking-wide text-gray-600 mb-1">
                  Instruções (texto de responsabilidade do beneficiário)
                </p>
                <ul className="text-[8px] leading-[1.5] space-y-[1px]">
                  <li>Referente a: {descricao}</li>
                  <li>Após o vencimento cobrar multa de {multa.toFixed(2)}% sobre o valor do título.</li>
                  <li>Após o vencimento cobrar juros de {juros.toFixed(2)}% ao mês (pro rata die).</li>
                  {instrucoesExtras
                    ? instrucoesExtras.split('\n').filter(Boolean).map((l, i) => <li key={i}>{l}</li>)
                    : null}
                  <li>Em caso de dúvidas, contate a {b.nomeCurto}.</li>
                </ul>
              </div>
              <div className="border-l border-gray-400 px-2 py-1 flex flex-col items-center justify-center">
                <p className="text-[7px] uppercase tracking-wide text-gray-600 mb-1">Pague com PIX</p>
                {pixQr ? (
                  <img src={pixQr} alt="QR Code PIX para pagamento" className="w-[86px] h-[86px]" />
                ) : (
                  <div className="w-[86px] h-[86px] border border-dashed border-gray-400" />
                )}
                <p className="text-[6.5px] text-center text-gray-600 mt-1 leading-tight">
                  Aponte a câmera do app do seu banco
                </p>
              </div>
            </div>
            <div className="border-l border-gray-400">
              <Field label="(-) Descontos / Abatimentos" value="" className="border-l-0 border-b border-gray-400" />
              <Field label="(+) Juros / Multa" value="" className="border-l-0 border-b border-gray-400" />
              <Field label="(=) Valor Cobrado" value="" className="border-l-0" />
            </div>
          </div>

          <div className="grid grid-cols-1 border-b border-gray-400">
            <Field
              label="Pagador"
              value={
                <>
                  {pagadorNome}
                  {pagadorDocumento ? ` — ${pagadorDocumento}` : ''}
                  {pagadorEndereco ? <span className="block text-[8px] text-gray-700">{pagadorEndereco}</span> : null}
                </>
              }
            />
          </div>

          {/* Código de barras */}
          <div className="px-2 py-2 flex items-end gap-3">
            <div className="flex-1">
              <BoletoBarcode code={numbers.barcode} height={46} />
            </div>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
              Autenticação Mecânica
            </span>
          </div>
        </div>

        <p className="mt-2 text-[6.5px] break-all text-gray-600 leading-tight">
          PIX Copia e Cola: {pixCode}
        </p>
      </section>
    </div>
  );
});

BoletoDocument.displayName = 'BoletoDocument';
