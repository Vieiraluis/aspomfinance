import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateEvent, useUpdateEvent, EventRow } from '@/hooks/useEventsData';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  event?: EventRow | null;
}

export function EventFormDialog({ open, onClose, event }: Props) {
  const [name, setName] = useState(event?.name || '');
  const [eventDate, setEventDate] = useState(event?.event_date || '');
  const [eventTime, setEventTime] = useState(event?.event_time || '20:00');
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditing = !!event;
  const isPending = createEvent.isPending || updateEvent.isPending;

  const handleSubmit = async () => {
    if (!name.trim() || !eventDate) return;
    const data = { name, event_date: eventDate, event_time: eventTime, location, description };

    if (isEditing) {
      await updateEvent.mutateAsync({ id: event!.id, ...data });
    } else {
      await createEvent.mutateAsync(data as any);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>Preencha os dados do evento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Evento *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Baile de Gala" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Local</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: ASPOM - Piedade" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes do evento..." rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={!name.trim() || !eventDate || isPending} className="w-full">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
