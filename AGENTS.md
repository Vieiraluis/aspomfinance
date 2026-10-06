# Architecture rules

- Reuse `FinancialActionsMenu` for payable and receivable list commands so both financial workflows stay visually and behaviorally aligned.
- Keep payable and receivable entry presentation in the shared `AccountEntryScreen`, with `EntryEntityCard` displaying registered entity details, so both workflows stay consistent without duplicating data.