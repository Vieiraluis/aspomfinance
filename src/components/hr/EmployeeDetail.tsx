import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TabGeneralInfo } from './tabs/TabGeneralInfo';
import { TabHealthAbsences } from './tabs/TabHealthAbsences';
import { TabBenefits } from './tabs/TabBenefits';
import { TabVacations } from './tabs/TabVacations';
import { TabDocuments } from './tabs/TabDocuments';

interface EmployeeDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Ativo', variant: 'default' },
  away: { label: 'Afastado', variant: 'secondary' },
  inactive: { label: 'Inativo', variant: 'destructive' },
};

export function EmployeeDetail({ open, onOpenChange, employee }: EmployeeDetailProps) {
  if (!employee) return null;
  const status = statusMap[employee.status] || statusMap.active;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={employee.photo_url || undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {employee.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{employee.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{employee.position || 'Sem cargo'}</span>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="general" className="text-xs">Informações</TabsTrigger>
            <TabsTrigger value="health" className="text-xs">Saúde</TabsTrigger>
            <TabsTrigger value="benefits" className="text-xs">Benefícios</TabsTrigger>
            <TabsTrigger value="vacations" className="text-xs">Férias</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="general"><TabGeneralInfo employee={employee} /></TabsContent>
          <TabsContent value="health"><TabHealthAbsences employeeId={employee.id} /></TabsContent>
          <TabsContent value="benefits"><TabBenefits employeeId={employee.id} /></TabsContent>
          <TabsContent value="vacations"><TabVacations employeeId={employee.id} /></TabsContent>
          <TabsContent value="documents"><TabDocuments employeeId={employee.id} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
