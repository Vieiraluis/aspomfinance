

## Plano: Usar data de baixa no recibo em vez da data de geração

### Problema
Atualmente, na linha 74 de `ReceiptDialog.tsx`, o recibo usa `issueDate: new Date()` (data atual de geração). O correto é usar a data em que a baixa foi feita (`paidAt` do objeto `Account`).

### Alterações

**1. `src/components/receipts/ReceiptDialog.tsx`**
- Trocar `issueDate: new Date()` por `issueDate: account.paidAt || new Date()` na geração dos recibos (linha 74)
- Fazer o mesmo na gravação no banco, onde `issue_date` recebe `receipt.issueDate.toISOString()` (já usa o valor do receipt, então basta a mudança acima)

**2. Nenhuma outra alteração necessária**
- O tipo `ReceiptData.issueDate` já é `Date`, compatível
- O `PrintableReceipt` já formata `receipt.issueDate` corretamente
- O campo `paidAt` já existe no tipo `Account` e é preenchido na baixa

### Resumo
Uma única linha alterada: a data do recibo passa a refletir a data de baixa do pagamento/recebimento.

