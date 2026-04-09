import { useState } from 'react';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bell, CheckCheck, AlertTriangle, Car, Fuel, ParkingCircle, ClipboardCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap: Record<string, any> = {
  corrida: Car,
  abastecimento: Fuel,
  zona_azul: ParkingCircle,
  checklist: ClipboardCheck,
  alerta: AlertTriangle,
};

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notificações</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <CheckCheck className="mr-1 h-3 w-3" /> Ler todas
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const Icon = iconMap[n.tipo] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.lida && markAsRead(n.id)}
                    className={`w-full text-left rounded-lg p-3 transition-colors ${
                      n.lida ? 'bg-background' : 'bg-accent'
                    } hover:bg-accent/80`}
                  >
                    <div className="flex gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${n.lida ? 'text-muted-foreground' : 'text-primary'}`} />
                      <div>
                        <p className={`text-sm ${n.lida ? 'text-muted-foreground' : 'font-medium'}`}>{n.mensagem}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(n.criado_em), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
