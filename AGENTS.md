# Architecture rules

- Reuse `FinancialActionsMenu` for payable and receivable list commands so both financial workflows stay visually and behaviorally aligned.
- Keep payable and receivable entry presentation in the shared `AccountEntryScreen`, with `EntryEntityCard` displaying registered entity details, so both workflows stay consistent without duplicating data.
- Reuse `SettleInstallmentsDialog` for row and entry settlement, backed by an authenticated atomic RPC with an idempotency key, so split methods, adjustments and bank movements stay consistent and cannot partially commit.
- Preserve the existing paid-row/residual-row model for partial settlement and store principal, interest and discount on payment history, so pending balances and cash-based reports remain compatible.