import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { LoadingSpinner, LoadingCard } from './ui/loading-spinner'
import { useToast } from './ui/simple-toast'
import { neokidsToast } from './ui/toast'
import { useLoadingStates } from '../hooks/useLoadingStates'
import { useDebounce } from '../hooks/useDebounce'
import { 
  Activity, 
  Clock, 
  User, 
  QrCode, 
  Search,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Appointment {
  id: string
  patientName: string
  status: string
  totalAmount: number
  services: Array<{
    id: string
    name: string
    code: string
  }>
  sampleIds: string[]
  createdAt: string
}

interface KanbanBoardProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

const statusConfig = {
  'Aguardando Coleta': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    nextStatus: 'Em Análise'
  },
  'Em Análise': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Activity,
    nextStatus: 'Aguardando Laudo'
  },
  'Aguardando Laudo': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
    nextStatus: 'Finalizado'
  },
  'Finalizado': {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Clock,
    nextStatus: null
  }
}

export const KanbanBoard = ({ accessToken, userRole, onNavigate }: KanbanBoardProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const { isLoading, withLoading } = useLoadingStates()
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { addToast } = useToast()

  useEffect(() => {
    fetchAppointments()
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchAppointments, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, debouncedSearchQuery, statusFilter])

  const fetchAppointments = async () => {
    try {
      await withLoading('fetchAppointments', async () => {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/appointments`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          setAppointments(data.appointments || [])
        } else {
          throw new Error('Erro ao carregar atendimentos')
        }
      })
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error)
      addToast({
        type: 'error',
        title: 'Erro ao carregar atendimentos',
        description: 'Tente novamente.'
      })
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    if (debouncedSearchQuery) {
      filtered = filtered.filter(appointment => 
        appointment.patientName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        appointment.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        appointment.sampleIds.some(id => id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    setFilteredAppointments(filtered)
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    addToast({
      type: 'info',
      title: 'Atualizando status...'
    })
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      )

      if (response.ok) {
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId ? { ...apt, status: newStatus } : apt
          )
        )
        addToast({
          type: 'success',
          title: 'Status atualizado',
          description: `Status atualizado para: ${newStatus}`
        })
      } else {
        throw new Error('Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      addToast({
        type: 'error',
        title: 'Erro ao atualizar status',
        description: 'Tente novamente.'
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    Object.keys(statusConfig).forEach(status => {
      counts[status] = filteredAppointments.filter(apt => apt.status === status).length
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (isLoading('fetchAppointments') && appointments.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Painel Laboratorial</h2>
        <div className="text-center py-8">
          <LoadingSpinner size="lg" text="Carregando atendimentos..." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Painel Laboratorial</h2>
        <Button onClick={fetchAppointments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por paciente, ID do atendimento ou amostra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {Object.keys(statusConfig).map(status => (
                    <SelectItem key={status} value={status}>
                      {status} ({statusCounts[status] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const StatusIcon = config.icon
          const appointmentsInStatus = filteredAppointments.filter(apt => apt.status === status)
          
          return (
            <div key={status} className="space-y-4">
              <Card className={`${config.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="w-4 h-4" />
                      <span>{status}</span>
                    </div>
                    <Badge variant="secondary">
                      {appointmentsInStatus.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {appointmentsInStatus.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {appointment.patientName}
                            </h4>
                            <p className="text-xs text-gray-500">
                              ID: {appointment.id.split('_')[1]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(appointment.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(appointment.totalAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 font-medium">Serviços:</p>
                          {appointment.services.slice(0, 2).map((service) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {service.code}
                              </Badge>
                              <span className="text-xs text-gray-700 truncate">
                                {service.name}
                              </span>
                            </div>
                          ))}
                          {appointment.services.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{appointment.services.length - 2} mais
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 font-medium">Amostras:</p>
                          <div className="flex flex-wrap gap-1">
                            {appointment.sampleIds.slice(0, 3).map((sampleId) => (
                              <div key={sampleId} className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1">
                                <QrCode className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-700">
                                  {sampleId.split('_')[1]}
                                </span>
                              </div>
                            ))}
                            {appointment.sampleIds.length > 3 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{appointment.sampleIds.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {config.nextStatus && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => updateAppointmentStatus(appointment.id, config.nextStatus!)}
                          >
                            <span className="mr-2">Avançar para {config.nextStatus}</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {appointmentsInStatus.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <StatusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum atendimento</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredAppointments.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' 
                ? 'Nenhum atendimento encontrado com os filtros aplicados'
                : 'Nenhum atendimento ativo no momento'
              }
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const StatusIcon = config.icon
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <StatusIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
                    <p className="text-xs text-gray-600">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}