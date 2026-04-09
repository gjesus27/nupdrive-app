import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
  dados?: any;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (tipo: string, mensagem: string, dados?: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', profile.id)
      .order('criado_em', { ascending: false })
      .limit(50);
    if (data) setNotifications(data as AppNotification[]);
  }, [profile]);

  useEffect(() => {
    loadNotifications();

    if (!profile) return;

    // Real-time subscription
    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `usuario_id=eq.${profile.id}`,
      }, (payload) => {
        const newNotif = payload.new as AppNotification;
        setNotifications(prev => [newNotif, ...prev]);
        toast.info(newNotif.mensagem, { duration: 5000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.lida).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', profile.id).eq('lida', false);
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const addNotification = async (tipo: string, mensagem: string, dados?: any) => {
    // Send notification to all admins
    const { data: admins } = await supabase.from('usuarios').select('id').eq('tipo', 'admin');
    if (admins) {
      for (const admin of admins) {
        await supabase.from('notificacoes').insert({
          usuario_id: admin.id,
          tipo,
          mensagem,
          dados,
        });
      }
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
