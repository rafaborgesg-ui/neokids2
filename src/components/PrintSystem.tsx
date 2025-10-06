import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useDebounce } from '../hooks/useDebounce';
import { Loader2, Printer, Search, QrCode, FileText } from 'lucide-react';

interface PrintSystemProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

// Simula a geração de um QR Code
const generateQRCode = (text: string) => `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(text)}`;

export const PrintSystem = ({ userRole, onNavigate }: PrintSystemProps) => {
  const { appointments, loading, fetchAppointments } = useAppointments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Busca por ID do atendimento
    if (debouncedSearch.length > 8) { // UUIDs são longos
      fetchAppointments({ patientId: undefined, appointmentId: debouncedSearch });
    }
  }, [debouncedSearch, fetchAppointments]);

  const handlePrint = () => {
    window.print(); // Dispara a impressão do navegador
  };

  return (
    <div className="space-y-6 printable-area">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-semibold text-gray-900">Sistema de Impressão</h2>
        <Button onClick={handlePrint} disabled={!selectedAppointment}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir Documentos
        </Button>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Buscar Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            placeholder="Digite o ID do atendimento para carregar os documentos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {loading && <Loader2 className="mt-2 animate-spin" />}
        </CardContent>
      </Card>

      {selectedAppointment ? (
        <div className="space-y-8">
          {/* Preview das Etiquetas */}
          <div>
            <h3 className="text-lg font-semibold mb-4 print-header">Etiquetas de Amostra</h3>
            <div className="grid grid-cols-2 gap-4">
              {selectedAppointment.appointment_services.map(({ services }) => (
                <Card key={services.id} className="p-4 border-dashed border-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{selectedAppointment.patients.name}</p>
                      <p className="text-sm">{services.name}</p>
                      <p className="text-xs text-gray-500">Atendimento: {selectedAppointment.id.substring(0, 8)}</p>
                    </div>
                    <img src={generateQRCode(`${selectedAppointment.id}-${services.id}`)} alt="QR Code" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Preview do Comprovante */}
          <div>
            <h3 className="text-lg font-semibold mb-4 print-header">Comprovante</h3>
            <Card className="p-6">
              <div className="text-center mb-4">
                <h2 className="font-bold text-xl">Neokids</h2>
                <p className="text-sm">Comprovante de Atendimento</p>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Paciente:</strong> {selectedAppointment.patients.name}</p>
                <p><strong>Data:</strong> {new Date(selectedAppointment.appointment_date).toLocaleString('pt-BR')}</p>
                <p><strong>ID Atendimento:</strong> {selectedAppointment.id}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Serviços:</h4>
                <ul>
                  {selectedAppointment.appointment_services.map(({ services }) => (
                    <li key={services.id} className="flex justify-between">
                      <span>{services.name}</span>
                      <span>R$ {services.base_price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-bold text-lg mt-2 border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {selectedAppointment.appointment_services.reduce((acc, s) => acc + s.services.base_price, 0).toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="text-center py-10">
          <FileText className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">Aguardando ID do atendimento para gerar documentos.</p>
        </Card>
      )}

      <style>{`
        @media print {
          .no-print { display: none; }
          .printable-area { margin: 0; padding: 0; }
          .print-header { margin-top: 20px; }
        }
      `}</style>
    </div>
  );
};