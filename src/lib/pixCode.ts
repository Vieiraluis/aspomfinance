// Gerador de PIX BR Code (EMV) — PIX Estático com valor
// Especificação: Manual do BR Code (Bacen)

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function sanitize(text: string, max: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .slice(0, max);
}

export interface PixCodeParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string; // até 25 chars alfanum
  description?: string;
}

export function generatePixCode(params: PixCodeParams): string {
  const { pixKey, merchantName, merchantCity, amount } = params;
  const txid = (params.txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  // Merchant Account Information (PIX)
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', pixKey);
  const desc = params.description ? tlv('02', sanitize(params.description, 40)) : '';
  const mai = tlv('26', gui + key + desc);

  const payload =
    tlv('00', '01') + // Payload Format Indicator
    mai +
    tlv('52', '0000') + // Merchant Category Code
    tlv('53', '986') + // Currency BRL
    tlv('54', amount.toFixed(2)) + // Amount
    tlv('58', 'BR') + // Country
    tlv('59', sanitize(merchantName, 25)) +
    tlv('60', sanitize(merchantCity, 15)) +
    tlv('62', tlv('05', txid)) + // Additional Data: TXID
    '6304';

  return payload + crc16(payload);
}
