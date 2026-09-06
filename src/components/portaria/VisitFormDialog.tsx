import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StorageAvatarImage } from '@/components/ui/storage-image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoCapture } from './PhotoCapture';
import { usePortariaLocais, useRegistrarEntrada } from '@/hooks/usePortariaData';
import { toast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

interface VisitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantao?: any;
}

export function VisitFormDialog({ open, onOpenChange, plantao }: VisitFormDialogProps) {
  const { data: locais = [] } = usePortariaLocais();
  const registrar = useRegistrarEntrada();

  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [localId, setLocalId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [foto, setFoto] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setNome('');
      setDocumento('');
      setLocalId('');
      setObservacoes('');
      setFoto(undefined);
    }
  }, [open]);

  const recepcionista = plantao?.employees;

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast({ title: 'Informe o nome do visitante', variant: 'destructive' });
      return;
    }
    if (!localId) {
      toast({ title: 'Selecione o destino da visita', variant: 'destructive' });
      return;
    }
    const local = locais.find((l: any) => l.id === localId);
    await registrar.mutateAsync({
      visitante_nome: nome.trim(),
      documento: documento.trim() || null,
      local_id: localId,
      destino_nome: local?.nome || null,
      observacoes: observacoes.trim() || null,
      foto_url: foto || null,
      recepcionista_employee_id: recepcionista?.id || null,
      recepcionista_nome: recepcionista?.name || null,
      recepcionista_foto_url: recepcionista?.photo_url || null,
    });
    onOpenChange(false);
  };

  const activeLocais = locais.filter((l: any) => l.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar entrada de visitante</DialogTitle>
          <DialogDescription>
            A data e a hora de entrada são gravadas automaticamente ao confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <Label>Foto do visitante</Label>
            <PhotoCapture value={foto} onChange={setFoto} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visitante">Nome do visitante *</Label>
              <Input
                id="visitante"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                autoFocus
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documento">Documento (opcional)</Label>
                <Input
                  id="documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="RG, CPF, CNH..."
                />
              </div>
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Select value={localId} onValueChange={setLocalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sala/departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLocais.length === 0 && (
                      <SelectItem value="__none" disabled>
                        Cadastre um destino primeiro
                      </SelectItem>
                    )}
                    {activeLocais.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="rounded-lg border border-border p-3 flex items-center gap-3 bg-muted/30">
              <Avatar className="w-10 h-10">
                <StorageAvatarImage url={recepcionista?.photo_url} alt={recepcionista?.name} />
                <AvatarFallback>{(recepcionista?.name || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="text-muted-foreground text-xs">Recepcionista de plantão</p>
                <p className="font-medium">{recepcionista?.name || 'Nenhum plantão ativo agora'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={registrar.isPending}>
            <LogIn className="w-4 h-4 mr-2" />
            Registrar entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
