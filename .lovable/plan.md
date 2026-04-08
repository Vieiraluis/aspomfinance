
# Módulo de Gestão de Eventos — Plano de Implementação

## Fase 1 — Banco de Dados e Estrutura Base
Criar as tabelas no banco de dados:
- **events**: nome, data, horário, local, layout_url, capacidade, descrição, status
- **event_tables**: numero, evento_id, status, area (VIP/Premium/Padrão/Econômica), posição x/y, assentos_por_mesa, preço
- **event_seats**: mesa_id, numero, status (disponível/reservado/bloqueado)
- **event_reservations**: cliente_nome, cliente_doc, evento_id, valor_total, status, qr_code, checked_in
- **event_reservation_items**: reserva_id, mesa_id, assento_id, preço

## Fase 2 — Painel Interativo de Mesas (Core)
- Mapa visual baseado no layout ASPOM (123 mesas)
- Layout pré-definido com posicionamento real das mesas
- Estados visuais: 🟢 Verde (disponível), 🔴 Vermelho (reservado), ⚪ Cinza (bloqueado)
- Modal ao clicar: detalhes da mesa, botões Reservar/Bloquear/Liberar
- Seleção múltipla de assentos e mesa inteira
- Palco, pista, entrada, cantina, banheiro posicionados

## Fase 3 — Gestão de Eventos (CRUD)
- Cadastro/edição de eventos
- Configuração de layout por evento
- Lista de eventos com filtros

## Fase 4 — Precificação e Carrinho
- Definir preços por área (VIP, Premium, Padrão, Econômica)
- Carrinho de compras com adição/remoção
- Resumo do pedido

## Fase 5 — Checkout e Vendas
- Simulador de pagamento (PIX, Cartão, Dinheiro)
- Confirmação de reserva
- Atualização em tempo real

## Fase 6 — Dashboard Financeiro
- Total faturado, mesas vendidas/disponíveis, taxa de ocupação
- Relatórios por período, evento e área

## Fase 7 — QR Code e Check-in
- Geração de QR Code por reserva
- Validação de ingresso
- Lista de presença

---

**Início**: Fases 1 e 2 (banco de dados + mapa interativo com o layout ASPOM de 123 mesas)
