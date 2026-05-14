
# Módulo de Gestão de Associados — ASPOM

Cria um módulo completo para cadastro de militares associados, geração automática de mensalidades recorrentes, controle de inadimplência, emissão de boleto com QR Code PIX e impressão em lote. Integra-se à estrutura existente (Supabase, Sidebar, design system slate/emerald).

## 1. Banco de dados (Supabase)

Duas novas tabelas com RLS por `user_id`:

### `associados`
- `photo_url`, `nome`, `cpf`, `rg_pmerj`, `identidade`, `posto_graduacao` (enum texto: Sd, Cb, 3ºSgt, 2ºSgt, 1ºSgt, ST, Asp, 2ºTen, 1ºTen, Cap, Maj, TC, Cel)
- `matricula_associacao` (único por user_id)
- `email`, `telefone`, `endereco_*` (cep, rua, número, bairro, cidade, estado)
- `banco`, `agencia`, `conta`, `pix_chave`
- `valor_mensalidade` (numeric, default 0)
- `data_adesao` (date)
- `dia_vencimento` (int 1–28, default 10)
- `status` ('ativo' | 'inativo' | 'suspenso')
- `observacoes`

### `mensalidades`
- `associado_id` (uuid)
- `competencia` (text `MM/YYYY`) + unique (`user_id`,`associado_id`,`competencia`)
- `valor`, `vencimento` (date), `pago_em` (date null)
- `status` ('pendente' | 'pago' | 'atrasado')
- `forma_pagamento`, `bank_account_id` (vínculo com conta bancária existente)
- `linha_digitavel`, `pix_payload` (texto BR Code), `pix_txid`
- Trigger para auto-atualizar `status='atrasado'` em consultas (via view) — na prática calculado client-side.

Configuração PIX em `receipt_settings` (reaproveitar) + novos campos `pix_key`, `pix_key_type`, `beneficiario_nome`, `beneficiario_cidade`.

## 2. Geração de mensalidades

- Botão "Gerar mensalidades do mês" no dashboard do módulo: cria mensalidades para todos os associados ativos na competência selecionada, ignorando duplicatas.
- Ao cadastrar associado já ativo, oferece gerar a primeira mensalidade.
- Função utilitária client-side calcula vencimento = `dia_vencimento` da competência.

## 3. Páginas (React/Vite + Tailwind)

```
src/pages/Associados.tsx              -> lista + filtros (status, posto, busca)
src/pages/AssociadoDetail.tsx         -> ficha + histórico mensalidades
src/pages/Mensalidades.tsx            -> grid filtrável por competência/status/posto
src/pages/AssociadosDashboard.tsx     -> KPIs + gráfico por posto
```

Componentes:
```
src/components/associados/AssociadoForm.tsx       -> dialog cadastro/edição (com upload de foto bucket logos)
src/components/associados/AssociadoFilters.tsx
src/components/associados/PrintableBoleto.tsx     -> layout carnê A4 (1 ou múltiplos por página)
src/components/associados/BoletoBatchDialog.tsx   -> seleção massa + PDF
src/components/associados/StatusBadge.tsx
```

Hooks:
```
src/hooks/useAssociados.ts          -> CRUD com TanStack Query
src/hooks/useMensalidades.ts        -> CRUD + geração em lote + baixa
src/lib/pixCode.ts                  -> gera BR Code (EMV) PIX estático/dinâmico
src/lib/boletoPdf.ts                -> jsPDF para boleto/carnê com QR Code
```

PIX: usaremos PIX **estático** (BR Code) com valor fixo por mensalidade — não exige integração bancária. Geração via algoritmo EMV padrão Bacen + CRC16. QR Code via `qrcode` (já compatível) — adicionar `bun add qrcode`.

## 4. Boleto / Carnê

Layout A4 retrato com:
- Cabeçalho: logomarca ASPOM + dados da associação
- Bloco do associado (nome, matrícula, CPF, posto)
- Valor, competência, vencimento
- "Linha digitável" gerada (formato cosmético — boleto registrado real exigiria convênio bancário; deixaremos campo editável manualmente)
- QR Code PIX + chave copia-e-cola
- 2 vias: recibo + ficha de compensação

Impressão em lote: dialog com checkboxes (associados × competências), gera PDF único multipágina via jsPDF.

## 5. Dashboard do módulo

Cards: Total a receber no mês, Recebido, Inadimplência %, Nº associados ativos. Gráfico Recharts (barras por posto: receita prevista × recebida). Lista dos 10 maiores inadimplentes.

## 6. Navegação

Adicionar item "Associados" no `Sidebar.tsx` com submenu (Dashboard, Associados, Mensalidades). Rotas no `App.tsx`.

## Notas técnicas

- RLS: `auth.uid() = user_id` em todas as policies.
- Foto: bucket `logos` (público) já existe — reutilizar pasta `associados/{user_id}/`.
- "Atrasado" calculado em runtime (`vencimento < hoje && status='pendente'`) para evitar cron — coerente com `useOverdueSync` do projeto.
- Reaproveitar `formatCurrency`, `formatDate`, normalização de datas 12:00 local (memória do projeto).
- Sem FAB / sem menu expansível (memória do projeto) — ações inline.

## Fora de escopo

- Boleto bancário registrado real (CNAB/integração banco) — apenas layout + linha digitável manual.
- Cobrança PIX dinâmica via API de PSP — usaremos PIX estático com valor.
- Envio automático por e-mail/WhatsApp (pode ser adicionado depois usando edge function existente).
