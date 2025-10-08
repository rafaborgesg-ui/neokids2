import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AppointmentStatus } from '../hooks/useAppointments'; // Manter os tipos
import { useKanban } from '../hooks/useKanban'; // Importar o novo hook
import { 
  Clock, 
  FlaskConical, 
  FileText, 
  CheckCircle,
  User,
  Calendar,
  Loader2
} from 'lucide-react';

interface KanbanBoardProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

// Definição das colunas do Kanban
const columns: { id: AppointmentStatus; title: string; icon: React.ElementType }[] = [
  { id: 'awaiting_collection', title: 'Aguardando Coleta', icon: Clock },
  { id: 'in_analysis', title: 'Em Análise', icon: FlaskConical },
  { id: 'awaiting_report', title: 'Aguardando Laudo', icon: FileText },
  { id: 'completed', title: 'Finalizado', icon: CheckCircle },
];

// Mapeamento de status para cores de badge
const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-gray-200 text-gray-800',
  awaiting_collection: 'bg-yellow-100 text-yellow-800',
  in_analysis: 'bg-blue-100 text-blue-800',
  awaiting_report: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
  'no-show': 'bg-gray-100 text-gray-500',
};

export const KanbanBoard = ({ userRole, onNavigate }: KanbanBoardProps) => {
  // Usar o novo hook otimizado para o Kanban
  const { appointments, loading, fetchLabAppointments, updateAppointmentStatus } = useKanban();

  useEffect(() => {
    fetchLabAppointments(); 
  }, [fetchLabAppointments]);

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    updateAppointmentStatus(appointmentId, newStatus);
  };

  const getAppointmentsByStatus = (status: AppointmentStatus) => {
    return appointments.filter(app => app.status === status);
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-4 text-gray-600">Carregando painel do laboratório...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Painel do Laboratório</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map(column => (
          <div key={column.id} className="bg-gray-50 rounded-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 sticky top-0 bg-gray-50 z-10">
              <CardTitle className="text-base font-medium flex items-center space-x-2">
                <column.icon className="w-4 h-4 text-gray-600" />
                <span>{column.title}</span>
              </CardTitle>
              <Badge variant="secondary">{getAppointmentsByStatus(column.id).length}</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {getAppointmentsByStatus(column.id).map(appointment => (
                <Card key={appointment.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-sm text-gray-800">{appointment.patients.name}</div>
                      <Badge className={`${statusColors[appointment.status]} text-xs`}>{column.title}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3" />
                        <span>ID: {appointment.id.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-xs font-medium mb-1 text-gray-700">Serviços:</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        {appointment.appointment_services.map(as => (
                          <div key={as.services.id} className="flex justify-between items-center">
                            <span>{as.services.name}</span>
                            <Badge variant="outline">{as.services.code}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    {userRole === 'administrador' || userRole === 'tecnico' ? (
                       <Select
                         value={appointment.status}
                         onValueChange={(newStatus: AppointmentStatus) => handleStatusChange(appointment.id, newStatus)}
                       >
                         <SelectTrigger className="w-full mt-2 h-8 text-xs">
                           <SelectValue placeholder="Mover para..." />
                         </SelectTrigger>
                         <SelectContent>
                           {columns.map(col => (
                             <SelectItem key={col.id} value={col.id} className="text-xs">
                               {col.title}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
               {getAppointmentsByStatus(column.id).length === 0 && (
                <div className="text-center py-10">
                  <p className="text-xs text-gray-400">Nenhum item nesta coluna.</p>
                </div>
              )}
            </CardContent>
          </div>
        ))}
      </div>
    </div>
  );
};