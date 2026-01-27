import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { MousePointerClick } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface DoubleClickInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onDoubleClickAction?: () => void;
  tooltipText?: string;
}

const DoubleClickInput = React.forwardRef<HTMLInputElement, DoubleClickInputProps>(
  ({ className, onDoubleClickAction, tooltipText = "Duplo clique para cadastrar novo", ...props }, ref) => {
    const handleDoubleClick = () => {
      if (onDoubleClickAction) {
        onDoubleClickAction();
      }
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Input
                ref={ref}
                onDoubleClick={handleDoubleClick}
                className={cn(
                  "pr-8 cursor-pointer",
                  className
                )}
                {...props}
              />
              <MousePointerClick 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" 
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-primary text-primary-foreground">
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
DoubleClickInput.displayName = 'DoubleClickInput';

export { DoubleClickInput };
