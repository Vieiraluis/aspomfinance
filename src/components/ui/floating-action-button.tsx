import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Printer, X } from 'lucide-react';

export interface FABAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'success';
  disabled?: boolean;
  hidden?: boolean;
}

interface FloatingActionButtonProps {
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  addLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  printLabel?: string;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  printDisabled?: boolean;
  hideAdd?: boolean;
  hideEdit?: boolean;
  hideDelete?: boolean;
  hidePrint?: boolean;
}

export function FloatingActionButton({
  onAdd,
  onEdit,
  onDelete,
  onPrint,
  addLabel = 'Incluir',
  editLabel = 'Alterar',
  deleteLabel = 'Excluir',
  printLabel = 'Imprimir',
  editDisabled = false,
  deleteDisabled = false,
  printDisabled = false,
  hideAdd = false,
  hideEdit = false,
  hideDelete = false,
  hidePrint = false,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const actions = [
    {
      label: printLabel,
      icon: <Printer className="w-4 h-4" />,
      onClick: () => { onPrint?.(); setIsOpen(false); },
      variant: 'default',
      disabled: printDisabled,
      hidden: hidePrint,
    },
    {
      label: deleteLabel,
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => { onDelete?.(); setIsOpen(false); },
      variant: 'destructive',
      disabled: deleteDisabled,
      hidden: hideDelete,
    },
    {
      label: editLabel,
      icon: <Pencil className="w-4 h-4" />,
      onClick: () => { onEdit?.(); setIsOpen(false); },
      variant: 'default',
      disabled: editDisabled,
      hidden: hideEdit,
    },
    {
      label: addLabel,
      icon: <Plus className="w-4 h-4" />,
      onClick: () => { onAdd?.(); setIsOpen(false); },
      variant: 'success',
      hidden: hideAdd,
    },
  ].filter(a => !a.hidden) as FABAction[];

  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25',
    success: 'bg-success text-white hover:bg-success/90 shadow-lg shadow-success/25',
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action buttons */}
      {actions.map((action, index) => (
        <div
          key={action.label}
          className={cn(
            'flex items-center gap-3 transition-all duration-300 ease-out',
            isOpen
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
          )}
          style={{
            transitionDelay: isOpen ? `${index * 60}ms` : '0ms',
          }}
        >
          {/* Label */}
          <span className="px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-sm font-medium shadow-md border border-border whitespace-nowrap">
            {action.label}
          </span>
          {/* Button */}
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200',
              variantStyles[action.variant || 'default'],
              action.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {action.icon}
          </button>
        </div>
      ))}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300',
          'bg-primary text-primary-foreground shadow-xl shadow-primary/30',
          'hover:shadow-2xl hover:shadow-primary/40 hover:scale-105',
          'active:scale-95',
          isOpen && 'rotate-45 bg-muted text-muted-foreground shadow-lg shadow-muted/20'
        )}
      >
        {isOpen ? <X className="w-6 h-6 rotate-[-45deg]" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
