import { useState, useEffect, useMemo } from 'react';
import { useSuppliers, useAddSupplier } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, UserPlus, Search, Loader2 } from 'lucide-react';
import { QuickSupplierDialog } from './QuickSupplierDialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SupplierSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  type: 'supplier' | 'receiver';
  placeholder?: string;
  disabled?: boolean;
}

export const SupplierSelect = ({
  value,
  onValueChange,
  type,
  placeholder = 'Selecione...',
  disabled = false,
}: SupplierSelectProps) => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isQuickDialogOpen, setIsQuickDialogOpen] = useState(false);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === value),
    [suppliers, value]
  );

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      ),
    [suppliers, search]
  );

  const label = type === 'supplier' ? 'Fornecedor' : 'Recebedor';

  const handleSupplierCreated = (supplierId: string) => {
    onValueChange(supplierId);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn(
              'w-full justify-between',
              !value && 'text-muted-foreground'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              selectedSupplier?.name || placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[200px]">
            {filteredSuppliers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum {label.toLowerCase()} encontrado.
              </div>
            ) : (
              <div className="p-1">
                {filteredSuppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    onClick={() => {
                      onValueChange(supplier.id === value ? '' : supplier.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      value === supplier.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === supplier.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{supplier.name}</span>
                      {supplier.document && (
                        <span className="text-xs text-muted-foreground">
                          {supplier.document}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-primary hover:text-primary"
              onClick={() => {
                setIsQuickDialogOpen(true);
                setOpen(false);
              }}
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar novo {label.toLowerCase()}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <QuickSupplierDialog
        open={isQuickDialogOpen}
        onOpenChange={setIsQuickDialogOpen}
        type={type}
        onSupplierCreated={handleSupplierCreated}
        initialName={search}
      />
    </>
  );
};
