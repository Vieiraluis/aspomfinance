// Convert number to Brazilian Portuguese words for currency
const ones = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];

const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];

const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  
  let result = '';
  
  if (n >= 100) {
    result += hundreds[Math.floor(n / 100)];
    n %= 100;
    if (n > 0) result += ' e ';
  }
  
  if (n >= 20) {
    result += tens[Math.floor(n / 10)];
    n %= 10;
    if (n > 0) result += ' e ';
  }
  
  if (n > 0 && n < 20) {
    result += ones[n];
  }
  
  return result;
}

export function numberToWords(value: number): string {
  if (value === 0) return 'Zero Reais';
  
  const intPart = Math.floor(value);
  const centPart = Math.round((value - intPart) * 100);
  
  let result = '';
  
  if (intPart > 0) {
    if (intPart >= 1000000) {
      const millions = Math.floor(intPart / 1000000);
      result += millions === 1 ? 'um milhão' : convertGroup(millions) + ' milhões';
      const remainder = intPart % 1000000;
      if (remainder > 0) {
        if (remainder < 100 || (remainder % 1000 < 100 && remainder % 1000 !== 0)) {
          result += ' e ';
        } else {
          result += ' ';
        }
      }
    }
    
    const afterMillion = intPart % 1000000;
    
    if (afterMillion >= 1000) {
      const thousands = Math.floor(afterMillion / 1000);
      if (thousands === 1) {
        result += 'mil';
      } else {
        result += convertGroup(thousands) + ' mil';
      }
      const remainder = afterMillion % 1000;
      if (remainder > 0) {
        if (remainder < 100) {
          result += ' e ';
        } else {
          result += ' ';
        }
      }
    }
    
    const lastGroup = afterMillion % 1000;
    if (lastGroup > 0) {
      result += convertGroup(lastGroup);
    }
    
    result = result.trim();
    result += intPart === 1 ? ' Real' : ' Reais';
  }
  
  if (centPart > 0) {
    if (intPart > 0) result += ' e ';
    result += convertGroup(centPart);
    result += centPart === 1 ? ' Centavo' : ' Centavos';
  }
  
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}
