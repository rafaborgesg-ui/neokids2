import React from 'react';
import { Card } from './ui/card';
import { Appointment } from '../hooks/useAppointments';

interface PrintLayoutProps {
  appointment: Appointment;
}

const generateQRCode = (text: string) => `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(text)}`;

export const PrintLayout = ({ appointment }: PrintLayoutProps) => {
  const total = appointment.appointment_services.reduce((acc, s) => acc + s.services.base_price, 0);

  return (
    <div className="space-y-8">
      {/* Etiquetas de Amostra */}
      <div>
        <h3 className="text-lg font-semibold mb-4 print-header">Etiquetas de Amostra</h3>
        <div className="grid grid-cols-2 gap-4">
          {appointment.appointment_services.map(({ services }) => (
            <Card key={services.id} className="p-4 border-dashed border-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{appointment.patients.name}</p>
                  <p className="text-sm">{services.name}</p>
                  <p className="text-xs text-gray-500">Atendimento: {appointment.id.substring(0, 8)}</p>
                </div>
                <img src={generateQRCode(`${appointment.id}-${services.id}`)} alt="QR Code" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Comprovante */}
      <div>
        <h3 className="text-lg font-semibold mb-4 print-header">Comprovante</h3>
        <Card className="p-6">
          <div className="text-center mb-4">
            <h2 className="font-bold text-xl">Neokids</h2>
            <p className="text-sm">Comprovante de Atendimento</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Paciente:</strong> {appointment.patients.name}</p>
            <p><strong>Data:</strong> {new Date(appointment.appointment_date).toLocaleString('pt-BR')}</p>
            <p><strong>ID Atendimento:</strong> {appointment.id}</p>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold">Serviços:</h4>
            <ul>
              {appointment.appointment_services.map(({ services }) => (
                <li key={services.id} className="flex justify-between">
                  <span>{services.name}</span>
                  <span>R$ {services.base_price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
