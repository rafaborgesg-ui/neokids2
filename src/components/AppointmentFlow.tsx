import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  User, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar,
  CreditCard,
  QrCode,
  Printer,
  CheckCircle,
  X
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Patient {
  id: string
  name: string
  cpf: string
}

interface Service {
  id: string
  name: string
  code: string
  basePrice: number
  category: string
}

interface AppointmentFlowProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

export const AppointmentFlow = ({ accessToken, userRole, onNavigate }: AppointmentFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [insuranceType, setInsuranceType] = useState('particular')
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (patientSearch.length >= 2) {
      searchPatients()
    } else {
      setSearchResults([])
    }
  }, [patientSearch])

  useEffect(() => {
    const total = selectedServices.reduce((sum, service) => sum + service.basePrice, 0)
    setTotalAmount(total)
  }, [selectedServices])

  const fetchServices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/services`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const searchPatients = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/patients/search?q=${encodeURIComponent(patientSearch)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.patients || [])
      }
    } catch (error) {
      console.error('Erro na busca:', error)
    }
  }

  const addService = (service: Service) => {
    if (!selectedServices.find(s => s.id === service.id)) {
      setSelectedServices([...selectedServices, service])
    }
  }

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId))
  }

  const createAppointment = async () => {
    setLoading(true)
    setError('')

    try {
      const appointmentData = {
        patientId: selectedPatient?.id,
        patientName: selectedPatient?.name,
        services: selectedServices,
        totalAmount,
        paymentMethod,
        insuranceType
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/appointments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(appointmentData)
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCreatedAppointment(data.appointment)
        setCurrentStep(4)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar atendimento')
      }
    } catch (error) {
      console.error('Erro ao criar atendimento:', error)
      setError('Erro ao criar atendimento')
    } finally {
      setLoading(false)
    }
  }

  const resetFlow = () => {
    setCurrentStep(1)
    setSelectedPatient(null)
    setPatientSearch('')
    setSearchResults([])
    setSelectedServices([])
    setPaymentMethod('')
    setInsuranceType('particular')
    setTotalAmount(0)
    setError('')
    setCreatedAppointment(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const generateQRCode = (text: string) => {
    // Simplified QR code representation
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(text)}`
  }

  const printDocument = () => {
    window.print()
  }

  const steps = [
    { number: 1, title: 'Identificar Paciente', icon: User },
    { number: 2, title: 'Selecionar Serviços', icon: Plus },
    { number: 3, title: 'Pagamento', icon: CreditCard },
    { number: 4, title: 'Finalização', icon: CheckCircle }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Jornada de Atendimento</h2>
        {currentStep > 1 && (
          <Button variant="outline" onClick={resetFlow}>
            Novo Atendimento
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center space-x-2 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Patient Identification */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Identificar Paciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                className="pl-10"
                placeholder="Buscar paciente por nome ou CPF..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedPatient(patient)
                      setSearchResults([])
                      setPatientSearch('')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.cpf}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Selecionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPatient && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">Paciente Selecionado</p>
                      <p className="text-green-700">{selectedPatient.name}</p>
                      <p className="text-sm text-green-600">{selectedPatient.cpf}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedPatient}
              >
                Próximo: Selecionar Serviços
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Service Selection */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {service.code}
                          </Badge>
                          <Badge className="text-xs">
                            {service.category}
                          </Badge>
                        </div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-green-600 font-semibold">
                          {formatCurrency(service.basePrice)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addService(service)}
                        disabled={selectedServices.find(s => s.id === service.id) !== undefined}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviços Selecionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Tipo de Atendimento</Label>
                  <Select value={insuranceType} onValueChange={setInsuranceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                      <SelectItem value="sus">SUS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedServices.map((service) => (
                    <div
                      key={service.id}
                      className="p-3 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">{service.name}</p>
                          <p className="text-sm text-blue-700">
                            {formatCurrency(service.basePrice)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedServices.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum serviço selecionado
                  </p>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                <div className="flex justify-between space-x-2">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={selectedServices.length === 0}
                  >
                    Próximo: Pagamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Payment */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Forma de Pagamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Transferência'].map((method) => (
                <button
                  key={method}
                  className={`p-4 border rounded-lg text-left hover:bg-gray-50 ${
                    paymentMethod === method ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setPaymentMethod(method)}
                >
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{method}</span>
                  </div>
                </button>
              ))}
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Resumo do Atendimento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Paciente:</span>
                    <span>{selectedPatient?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="capitalize">{insuranceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serviços:</span>
                    <span>{selectedServices.length} item(s)</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={createAppointment}
                disabled={!paymentMethod || loading}
              >
                {loading ? 'Finalizando...' : 'Finalizar Atendimento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Completion */}
      {currentStep === 4 && createdAppointment && (
        <div className="space-y-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                Atendimento Criado com Sucesso!
              </h3>
              <p className="text-green-700">
                ID do Atendimento: <strong>{createdAppointment.id}</strong>
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Etiquetas de Amostra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {createdAppointment.sampleIds?.map((sampleId: string, index: number) => (
                    <div key={sampleId} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{selectedServices[index]?.name}</p>
                          <p className="text-sm text-gray-600">Amostra: {sampleId}</p>
                        </div>
                        <img
                          src={generateQRCode(sampleId)}
                          alt="QR Code"
                          className="w-16 h-16"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" onClick={printDocument}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Etiquetas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comprovante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-bold text-lg">Neokids</h3>
                    <p className="text-sm text-gray-600">Clínica e Laboratório Pediátrico</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Data/Hora:</span>
                      <span>{new Date().toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atendimento:</span>
                      <span>{createdAppointment.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paciente:</span>
                      <span>{selectedPatient?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagamento:</span>
                      <span>{paymentMethod}</span>
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <h4 className="font-medium mb-2">Serviços:</h4>
                    {selectedServices.map((service) => (
                      <div key={service.id} className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span>{formatCurrency(service.basePrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full mt-4" onClick={printDocument}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Comprovante
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button onClick={resetFlow}>
              Novo Atendimento
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}