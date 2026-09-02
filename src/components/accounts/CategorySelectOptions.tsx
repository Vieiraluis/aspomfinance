import { SelectGroup, SelectItem, SelectLabel } from '@/components/ui/select';
import { categoryGroups, categoryLabels } from '@/types/financial';

/**
 * Opções de categoria agrupadas por relatividade e ordenadas alfabeticamente.
 * Usar dentro de <SelectContent>.
 */
export function CategorySelectOptions() {
  return (
    <>
      {categoryGroups.map((group) => (
        <SelectGroup key={group.label}>
          <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">
            {group.label}
          </SelectLabel>
          {group.categories.map((key) => (
            <SelectItem key={key} value={key}>
              {categoryLabels[key]}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}
