import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { usePortariaLocais, useSaveLocal, useDeleteLocal } from '@/hooks/usePortariaData';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, DoorOpen } from 'lucide-react';

export function LocaisManager() {
  const { data: locais = [] } = usePortariaLocais();
  const saveLocal = useSaveLocal();
  const deleteLocal = useDeleteLocal();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const handleAdd = async () => {
    if (!nome.trim()) {
      toast({ title: 'Informe o nome da sala ou departamento', variant: 'destructive' });
      return;
    }
    await saveLocal.mutateAsync({ nome: nome.trim(), descricao: descricao.trim() || null });
    setNome('');
    setDescricao('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DoorOpen className="w-4 h-4" /> Salas e departamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Diretoria" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: 2º andar, sala 12"
            />
          </div>
          <Button onClick={handleAdd} disabled={saveLocal.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Incluir
          </Button>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {locais.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nenhum destino cadastrado.</p>
          )}
          {locais.map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{l.nome}</p>
                {l.descricao && <p className="text-xs text-muted-foreground truncate">{l.descricao}</p>}
              </div>
              {!l.is_active && <Badge variant="secondary">Inativo</Badge>}
              <Switch
                checked={l.is_active}
                onCheckedChange={(checked) => saveLocal.mutate({ id: l.id, is_active: checked })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => deleteLocal.mutate(l.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
