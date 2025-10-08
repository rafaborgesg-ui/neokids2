import React, { useEffect } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { Loader2, Calendar, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientHistoryProps {
  patientId: string;
  patientName: string;
}

export const PatientHistory = ({ patientId, patientName }: PatientHistoryProps) => {
  const { appointments, loading, fetchAppointments } = useAppointments();

  useEffect(() => {
    if (patientId) {
      fetchAppointments({ patientId });
    }
  }, [patientId, fetchAppointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Finalizado</Badge>;
      case 'awaiting_collection':
        return <Badge className="bg-yellow-100 text-yellow-800">Aguardando Coleta</Badge>;
      case 'in_analysis':
        return <Badge className="bg-blue-100 text-blue-800">Em Análise</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center h-48 flex flex-col justify-center items-center">
        <Calendar className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Nenhum histórico de atendimento encontrado para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map(appointment => (
        <div key={appointment.id} className="p-4 border rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold">
                {format(new Date(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
              </p>
              <p className="text-xs text-gray-500 font-mono">ID: {appointment.id.substring(0, 8)}</p>
            </div>
            {getStatusBadge(appointment.status)}
          </div>
          <div className="border-t pt-2 mt-2">
            <h4 className="text-sm font-medium mb-1">Serviços Realizados:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {appointment.appointment_services.map(serviceItem => (
                <li key={serviceItem.services.id}>{serviceItem.services.name}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};
