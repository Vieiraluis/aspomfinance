import { Account } from '@/types/financial';
import { SettleInstallmentsDialog } from '@/components/accounts/SettleInstallmentsDialog';

interface PaymentDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentDialog = ({ account, open, onOpenChange }: PaymentDialogProps) => (
  <SettleInstallmentsDialog
    accounts={account ? [account] : []}
    open={open}
    onOpenChange={onOpenChange}
  />
);
