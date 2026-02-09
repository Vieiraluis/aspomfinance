import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * Currency input that auto-formats as the user types digits.
 * The user only types numbers — decimal separator is placed automatically.
 * Internally stores the value as a plain number string (e.g. "1234.56").
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    
    // Convert internal value (e.g. "1234.56") to display format ("1.234,56")
    const formatDisplay = (val: string): string => {
      if (!val || val === '0' || val === '') return '';
      const num = parseFloat(val);
      if (isNaN(num)) return '';
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const [displayValue, setDisplayValue] = React.useState(() => formatDisplay(value));

    React.useEffect(() => {
      setDisplayValue(formatDisplay(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      
      if (raw === '') {
        setDisplayValue('');
        onValueChange('');
        return;
      }

      // Convert to cents then to decimal
      const cents = parseInt(raw, 10);
      const decimal = (cents / 100).toFixed(2);
      
      // Format for display
      const num = parseFloat(decimal);
      const formatted = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      setDisplayValue(formatted);
      onValueChange(decimal);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
