import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { usePatients, Patient } from '../hooks/usePatients';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useExamResults, ExamResult, UpsertExamResult } from '../hooks/useExamResults';
import { useDebounce } from '../hooks/useDebounce';
import { 
  Search, 
  User, 
  Calendar, 
  FileText, 
  Loader2,
  Save,
  CheckCircle, // Adicionar ícone de sucesso
  FlaskConical
} from 'lucide-react';

interface ExamResultsProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const ExamResults = ({ userRole, onNavigate }: ExamResultsProps) => {
  // Hooks de dados
  const { patients, loading: patientsLoading, fetchPatients } = usePatients();
  const { appointments, loading: appointmentsLoading, fetchAppointments } = useAppointments();
  const { results, loading: resultsLoading, fetchResultsForAppointments, upsertResult } = useExamResults();

  // Estado da UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingResults, setEditingResults] = useState<Record<string, any>>({});
  const [savingStates, setSavingStates] = useState<Record<string, 'saving' | 'saved' | null>>({});

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      fetchPatients(debouncedSearch);
    }
  }, [debouncedSearch, fetchPatients]);

  useEffect(() => {
    if (selectedPatient) {
      fetchAppointments({ patientId: selectedPatient.id });
    }
  }, [selectedPatient, fetchAppointments]);

  useEffect(() => {
    if (selectedAppointment) {
      fetchResultsForAppointments([selectedAppointment.id]);
    }
  }, [selectedAppointment, fetchResultsForAppointments]);

  const handleResultChange = (serviceId: string, field: string, value: any) => {
    setEditingResults(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      },
    }));
  };

  const handleSaveResult = async (serviceId: string) => {
    if (!selectedAppointment || !selectedPatient) return;

    const serviceResult = editingResults[serviceId];
    if (!serviceResult) return;

    setSavingStates(prev => ({ ...prev, [serviceId]: 'saving' }));

    const resultData: UpsertExamResult = {
      appointment_id: selectedAppointment.id,
      service_id: serviceId,
      patient_id: selectedPatient.id,
      result_data: { value: serviceResult.value },
      notes: serviceResult.notes,
      status: 'final',
    };

    const saved = await upsertResult(resultData);

    if (saved) {
      setSavingStates(prev => ({ ...prev, [serviceId]: 'saved' }));
      
      // ATUALIZAÇÃO DA UI: Atualiza o estado local para refletir a mudança
      setSelectedAppointment(prev => {
        if (!prev) return null;
        const newAppointmentServices = prev.appointment_services.map(as => {
          if (as.services.id === serviceId) {
            return {
              ...as,
              result_data: resultData.result_data,
              notes: resultData.notes || '', // Garante que o valor seja sempre uma string
            };
          }
          return as;
        });
        return { ...prev, appointment_services: newAppointmentServices };
      });

      setTimeout(() => {
        setSavingStates(prev => ({ ...prev, [serviceId]: null }));
      }, 2000);
    } else {
      setSavingStates(prev => ({ ...prev, [serviceId]: null }));
      // Adicionar toast de erro aqui
    }
  };

  const getResultForService = (serviceId: string): ExamResult | undefined => {
    return results.find(r => r.service_id === serviceId);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Resultados de Exames</h2>

      {/* Seção de Busca de Paciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Buscar Paciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Digite o nome ou CPF do paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {patientsLoading && <Loader2 className="mt-2 animate-spin" />}
          <div className="mt-2 space-y-1">
            {patients.map(p => (
              <div key={p.id} onClick={() => setSelectedPatient(p)} className="p-2 hover:bg-gray-100 cursor-pointer rounded">
                {p.name} - {p.cpf}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna de Atendimentos */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Atendimentos de {selectedPatient.name.split(' ')[0]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointmentsLoading && <Loader2 className="animate-spin" />}
              {appointments.map(app => (
                <div 
                  key={app.id} 
                  onClick={() => setSelectedAppointment(app)}
                  className={`p-3 rounded-lg cursor-pointer ${selectedAppointment?.id === app.id ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <p className="font-semibold">{new Date(app.appointment_date).toLocaleDateString('pt-BR')}</p>
                  <p className="text-xs text-gray-500">{app.id.substring(0,8)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Coluna de Resultados */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Resultados do Atendimento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultsLoading && <Loader2 className="animate-spin" />}
              {!selectedAppointment && <p className="text-gray-500">Selecione um atendimento para ver os resultados.</p>}
              
              {selectedAppointment && (
                <div className="space-y-4">
                  {selectedAppointment.appointment_services.map(({ services }) => {
                    // Acessa os dados diretamente da junção, que é mais confiável
                    const serviceInAppointment = selectedAppointment.appointment_services.find(s => s.services.id === services.id);
                    const result = serviceInAppointment?.result_data;
                    const notes = serviceInAppointment?.notes;

                    const isEditing = !!editingResults[services.id];
                    const currentResultValue = isEditing ? editingResults[services.id]?.value : result?.value || '';
                    const currentNotesValue = isEditing ? editingResults[services.id]?.notes : notes || '';
                    const savingStatus = savingStates[services.id];

                    return (
                      <div key={services.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-800">{services.name}</h3>
                          <Badge variant={result ? 'default' : 'outline'}>
                            {result ? 'Finalizado' : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div>
                            <Label>Resultado</Label>
                            <Input 
                              value={currentResultValue}
                              onChange={(e) => handleResultChange(services.id, 'value', e.target.value)}
                              placeholder="Insira o valor do resultado"
                            />
                          </div>
                          <div>
                            <Label>Notas</Label>
                            <Textarea 
                              value={currentNotesValue}
                              onChange={(e) => handleResultChange(services.id, 'notes', e.target.value)}
                              placeholder="Notas do analista"
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={() => handleSaveResult(services.id)} size="sm" disabled={savingStatus === 'saving'}>
                              {savingStatus === 'saving' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              {savingStatus === 'saved' && <CheckCircle className="w-4 h-4 mr-2 text-green-500" />}
                              {savingStatus ? (savingStatus === 'saved' ? 'Salvo!' : 'Salvando...') : 'Salvar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};