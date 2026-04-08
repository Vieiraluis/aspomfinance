import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEvents, useDeleteEvent, EventRow } from '@/hooks/useEventsData';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { Plus, Calendar, MapPin, Clock, Trash2, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  active: { label: 'Ativo', variant: 'default' },
  finished: { label: 'Encerrado', variant: 'destructive' },
};

export default function Events() {
  const { data: events, isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Eventos</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus eventos, mesas e reservas</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !events || events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum evento cadastrado</h3>
              <p className="text-muted-foreground mb-4">Crie seu primeiro evento para começar a gerenciar mesas e reservas.</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => {
              const statusInfo = STATUS_LABEL[event.status] || STATUS_LABEL.draft;
              return (
                <Card key={event.id} className="hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => navigate(`/events/${event.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.event_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {event.event_time?.slice(0, 5)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    {event.capacity > 0 && (
                      <p className="text-xs text-muted-foreground">{event.capacity} lugares</p>
                    )}
                    <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>
                        <Eye className="w-3 h-3 mr-1" />
                        Abrir
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setShowForm(true); }}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteEvent.mutate(event.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EventFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingEvent(null); }}
        event={editingEvent}
      />
    </MainLayout>
  );
}
