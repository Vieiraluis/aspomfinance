import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useEvent,
  useEventTables,
  useEventSeats,
  useEventReservations,
  useReservationItems,
  useGenerateEventLayout,
  useUpdateEvent,
  EventTableRow,
} from '@/hooks/useEventsData';
import { TableMapASPOM } from '@/components/events/TableMapASPOM';
import { EventCart } from '@/components/events/EventCart';
import { EventDashboard } from '@/components/events/EventDashboard';
import { CheckoutDialog } from '@/components/events/CheckoutDialog';
import { ReservationsList } from '@/components/events/ReservationsList';
import { BulkPriceEditor } from '@/components/events/BulkPriceEditor';
import { ArrowLeft, Loader2, LayoutGrid, Calendar, MapPin, Users, Play, Ticket, Building2 } from 'lucide-react';
import { LocacaoEspacosPanel } from '@/components/events/LocacaoEspacosPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading: loadingEvent } = useEvent(eventId);
  const { data: tables = [], isLoading: loadingTables } = useEventTables(eventId);
  const { data: seats = [] } = useEventSeats(eventId);
  const { data: reservations = [] } = useEventReservations(eventId);
  const { data: reservationItems = [] } = useReservationItems(eventId);
  const generateLayout = useGenerateEventLayout();
  const updateEvent = useUpdateEvent();

  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const selectedTables = useMemo(
    () => tables.filter(t => selectedTableIds.includes(t.id)),
    [tables, selectedTableIds]
  );

  const toggleTable = (tableId: string) => {
    setSelectedTableIds(prev =>
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const handleGenerateLayout = () => {
    if (!eventId) return;
    generateLayout.mutate({ eventId, seatsPerTable: 10 });
  };

  const handleActivate = () => {
    if (!eventId) return;
    updateEvent.mutate({ id: eventId, status: 'active' });
  };

  if (loadingEvent) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Evento não encontrado</p>
          <Button variant="link" onClick={() => navigate('/events')}>Voltar</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/events')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                  {event.status === 'active' ? 'Ativo' : event.status === 'finished' ? 'Encerrado' : 'Rascunho'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(event.event_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })} às {event.event_time?.slice(0, 5)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location}
                  </span>
                )}
                {event.capacity > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {event.capacity} lugares
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {event.status === 'draft' && tables.length > 0 && (
              <Button onClick={handleActivate} variant="default">
                <Play className="w-4 h-4 mr-2" />
                Ativar Evento
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Stats */}
        <EventDashboard tables={tables} reservations={reservations} />

        {/* Main Content */}
        {tables.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <LayoutGrid className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Layout não configurado</h3>
              <p className="text-muted-foreground mb-4">
                Gere o layout ASPOM com 123 mesas para começar a gerenciar as reservas.
              </p>
              <Button onClick={handleGenerateLayout} disabled={generateLayout.isPending}>
                {generateLayout.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
                ) : (
                  <><LayoutGrid className="w-4 h-4 mr-2" />Gerar Layout ASPOM (123 mesas)</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="map">
            <TabsList>
              <TabsTrigger value="map">Mapa de Mesas</TabsTrigger>
              <TabsTrigger value="reservations">Reservas ({reservations.length})</TabsTrigger>
              <TabsTrigger value="locacao"><Building2 className="w-3.5 h-3.5 mr-1" /> Locação de Espaço</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <TableMapASPOM
                  tables={tables}
                  seats={seats}
                  eventId={eventId!}
                  selectedTables={selectedTableIds}
                  onToggleTable={toggleTable}
                  reservations={reservations}
                  reservationItems={reservationItems}
                />
                <EventCart
                  selectedTables={selectedTables}
                  onRemove={(id) => setSelectedTableIds(prev => prev.filter(t => t !== id))}
                  onClear={() => setSelectedTableIds([])}
                  onCheckout={() => setShowCheckout(true)}
                />
              </div>
            </TabsContent>

            <TabsContent value="reservations" className="mt-4">
              <ReservationsList
                reservations={reservations}
                reservationItems={reservationItems}
                tables={tables}
                eventId={eventId!}
              />
            </TabsContent>

            <TabsContent value="locacao" className="mt-4">
              <LocacaoEspacosPanel />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BulkPriceEditor tables={tables} eventId={eventId!} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <CheckoutDialog
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        tables={selectedTables}
        eventId={eventId!}
        onSuccess={() => setSelectedTableIds([])}
      />
    </MainLayout>
  );
}
