import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useNotifications } from '../hooks/useNotifications';
import { Loader2, Bell, CheckCheck, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationSystemProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

const iconMap = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  alert: <ShieldAlert className="w-5 h-5 text-red-500" />,
};

export const NotificationSystem = ({ userRole, onNavigate }: NotificationSystemProps) => {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Central de Notificações</h2>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Você tem {unreadCount} notificações não lidas.</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma notificação nova.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div key={notification.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-white hover:bg-gray-50">
                  <div className="flex-shrink-0">{iconMap[notification.type]}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                    Marcar como lida
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};