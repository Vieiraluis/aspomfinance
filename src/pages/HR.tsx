import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees, useDeleteEmployee } from '@/hooks/useHRData';
import { EmployeeForm } from '@/components/hr/EmployeeForm';
import { EmployeeDetail } from '@/components/hr/EmployeeDetail';
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Ativo', variant: 'default' },
  away: { label: 'Afastado', variant: 'secondary' },
  inactive: { label: 'Inativo', variant: 'destructive' },
};

export default function HR() {
  const { data: employees = [], isLoading } = useEmployees();
  const deleteEmployee = useDeleteEmployee();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [detailEmployee, setDetailEmployee] = useState<any>(null);

  const departments = useMemo(() => {
    const depts = new Set(employees.map((e: any) => e.department).filter(Boolean));
    return Array.from(depts).sort() as string[];
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e: any) => {
      const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.cpf?.includes(search) || e.position?.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'all' || e.department === deptFilter;
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e: any) => e.status === 'active').length,
    away: employees.filter((e: any) => e.status === 'away').length,
  }), [employees]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Gestão de RH</h1>
            <p className="text-sm text-muted-foreground">Departamento Pessoal</p>
          </div>
          <Button onClick={() => { setEditEmployee(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Novo Funcionário
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{stats.total}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-green-500" /><div><p className="text-xs text-muted-foreground">Ativos</p><p className="text-xl font-bold">{stats.active}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-yellow-500" /><div><p className="text-xs text-muted-foreground">Afastados</p><p className="text-xl font-bold">{stats.away}</p></div></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome, CPF ou cargo..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Departamentos</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="away">Afastados</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employee List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum funcionário encontrado</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp: any) => {
              const status = statusMap[emp.status] || statusMap.active;
              return (
                <Card key={emp.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={emp.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{emp.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{emp.position || 'Sem cargo'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {emp.department && <span className="text-xs text-muted-foreground">{emp.department}</span>}
                          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">{status.label}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                      <Button size="icon" variant="ghost" onClick={() => setDetailEmployee(emp)}><Eye className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditEmployee(emp); setFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os dados do funcionário serão removidos.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteEmployee.mutate(emp.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EmployeeForm open={formOpen} onOpenChange={setFormOpen} employee={editEmployee} />
      <EmployeeDetail open={!!detailEmployee} onOpenChange={(open) => !open && setDetailEmployee(null)} employee={detailEmployee} />
    </MainLayout>
  );
}
