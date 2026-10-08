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

const Field = ({ label, value, className = '', strong = false, align = 'left' }: {
  label: string; value: React.ReactNode; className?: string; strong?: boolean; align?: 'left' | 'right';
}) => (
  <div className={`boleto-field ${strong ? 'boleto-field-strong' : ''} ${align === 'right' ? 'boleto-align-right' : ''} ${className}`}>
    <p className="boleto-label">{label}</p>
    <div className="boleto-value">{value || '\u00A0'}</div>
  </div>
);

const BankHeader = ({ compensation = false }: { compensation?: boolean }) => (
  <header className={`boleto-bank-header ${compensation ? 'boleto-bank-compensation' : ''}`}>
    <div className="boleto-bank-brand">
      <img src={aspomLogo} alt="Logotipo ASPOM" />
      <div><p className="boleto-bank-code">{ITAU_BENEFICIARIO.bancoCodigo}-{ITAU_BENEFICIARIO.bancoDv}</p>
        {!compensation && <p className="boleto-bank-name">Banco {ITAU_BENEFICIARIO.banco}</p>}
      </div>
    </div>
    {!compensation && <p className="boleto-section-title">Recibo do Pagador</p>}
  </header>
);

export const BoletoDocument = forwardRef<HTMLDivElement, { data: BoletoData }>(({ data }, ref) => {
  const b = ITAU_BENEFICIARIO;
  const { numbers, pagadorNome, pagadorDocumento, pagadorEndereco, vencimento, total, itens,
    descricao, documento, juros, multa, instrucoesExtras, pixCode, pixQr } = data;
  const beneficiary = `${b.nome} — CNPJ ${b.cnpj}`;
  const payer = `${pagadorNome}${pagadorDocumento ? ` — ${pagadorDocumento}` : ''}`;
  return (
    <div ref={ref} className="boleto-sheet">
      <section className="boleto-payer-receipt">
        <BankHeader />
        <div className="boleto-row boleto-row-main">
          <Field label="Beneficiário" value={beneficiary} />
          <Field label="Agência / Código do Beneficiário" value={numbers.agenciaConta} className="boleto-highlight-soft" />
        </div>
        <div className="boleto-row boleto-row-four">
          <Field label="Nosso Número" value={numbers.nossoNumeroFormatado} />
          <Field label="Documento" value={documento} />
          <Field label="Vencimento" value={formatDate(vencimento)} strong className="boleto-highlight" />
          <Field label="Valor do Documento" value={formatCurrency(total)} strong align="right" className="boleto-highlight-medium" />
        </div>
        <div className="boleto-row boleto-row-payer">
          <Field label="Pagador" value={payer} className="boleto-payer-name" />
          <Field label="Lançamentos" value={String(itens.length)} />
        </div>
        <div className="boleto-demonstrative">
          <p className="boleto-label">Demonstrativo / Histórico</p>
          <table>
            <thead><tr><th>Vencimento</th><th>Documento</th><th>Descrição</th><th>Valor</th></tr></thead>
            <tbody>{itens.map(i => <tr key={i.id}>
              <td>{formatDate(i.vencimento)}</td><td>{i.codigo || '—'}</td>
              <td>{i.descricao}</td><td>{formatCurrency(i.valor)}</td>
            </tr>)}</tbody>
            <tfoot><tr><td colSpan={3}>Total</td><td className="boleto-highlight">{formatCurrency(total)}</td></tr></tfoot>
          </table>
        </div>
      </section>

      <div className="boleto-cut"><span />Corte aqui<span /></div>

      <section className="boleto-compensation">
        <div className="boleto-compensation-heading">
          <BankHeader compensation />
          <div className="boleto-digitable"><p>{numbers.linhaDigitavel}</p><span>Ficha de Compensação</span></div>
        </div>
        <div className="boleto-row boleto-row-main">
          <Field label="Local de Pagamento" value="Pagável em qualquer banco, lotérica ou aplicativo até o vencimento. Após o vencimento, pague pelo PIX." />
          <Field label="Vencimento" value={formatDate(vencimento)} strong align="right" className="boleto-highlight-medium" />
        </div>
        <div className="boleto-row boleto-row-main">
          <Field label="Beneficiário" value={beneficiary} />
          <Field label="Agência / Código do Beneficiário" value={numbers.agenciaConta} align="right" className="boleto-highlight-soft" />
        </div>
        <div className="boleto-row boleto-row-bank-details">
          <Field label="Data do Doc." value={formatDate(new Date())} />
          <Field label="Nº do Doc." value={documento} />
          <Field label="Espécie Doc." value="DM" />
          <Field label="Aceite" value="N" />
          <Field label="Processamento" value={formatDate(new Date())} />
          <Field label="Nosso Número" value={numbers.nossoNumeroFormatado} align="right" className="boleto-highlight-soft" />
        </div>
        <div className="boleto-row boleto-row-amount-details">
          <Field label="Uso do Banco" value="" />
          <Field label="Carteira" value={b.carteira} />
          <Field label="Espécie" value="R$" />
          <Field label="Quantidade" value={String(itens.length)} />
          <Field label="Valor" value="" />
          <Field label="(=) Valor do Documento" value={formatCurrency(total)} strong align="right" className="boleto-highlight-bold" />
        </div>
        <div className="boleto-instructions-row">
          <div className="boleto-instructions">
            <p className="boleto-label">Instruções (texto de responsabilidade do beneficiário)</p>
            <ul><li className="boleto-reference">Referente a: {descricao}</li>
              <li>Após o vencimento cobrar multa de {multa.toFixed(2)}% sobre o valor do título.</li>
              <li>Após o vencimento cobrar juros de {juros.toFixed(2)}% ao mês (pro rata die).</li>
              {instrucoesExtras?.split('\n').filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}
              <li>Em caso de dúvidas, contate a {b.nomeCurto}.</li>
            </ul>
          </div>
          <div className="boleto-pix">
            {pixQr ? <img src={pixQr} alt="QR Code PIX para pagamento" /> : <div className="boleto-qr-empty" />}
            <p>Pague com PIX</p><span>Aponte a câmera do app do seu banco</span>
          </div>
          <div className="boleto-adjustments">
            <Field label="(-) Descontos / Abatimentos" value="" />
            <Field label="(+) Juros / Multa" value="" />
            <Field label="(=) Valor Cobrado" value="" className="boleto-highlight" />
          </div>
        </div>
        <Field label="Pagador" value={<>{payer}{pagadorEndereco && <span className="boleto-payer-address">{pagadorEndereco}</span>}</>} className="boleto-payer-name boleto-payer-block" />
        <div className="boleto-barcode-area">
          <div className="boleto-barcode-line"><div className="boleto-barcode"><BoletoBarcode code={numbers.barcode} height={64} /></div>
            <span>Autenticação Mecânica</span></div>
          <p className="boleto-pix-copy">PIX Copia e Cola: {pixCode}</p>
        </div>
      </section>
      <footer className="boleto-footer">Documento gerado eletronicamente para ASPOM — Associação Beneficente dos Subtenentes e Sargentos da PM</footer>
    </div>
  );
});
BoletoDocument.displayName = 'BoletoDocument';
