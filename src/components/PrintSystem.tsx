import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Printer,
  QrCode,
  FileText,
  Download,
  Settings,
  RefreshCw,
  Calendar,
  User,
  Activity,
  Tag,
  Receipt,
  FileImage,
  Search
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface PrintJob {
  id: string
  type: 'label' | 'receipt' | 'report' | 'result'
  title: string
  patientName?: string
  sampleId?: string
  appointmentId?: string
  status: 'pending' | 'printing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  copies: number
  format: 'A4' | 'label-small' | 'label-large' | 'thermal'
  createdAt: string
  printedAt?: string
  data: any
}

interface PrintTemplate {
  id: string
  name: string
  type: 'label' | 'receipt' | 'report' | 'result'
  format: string
  template: string
  isActive: boolean
}

interface PrintSystemProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

export const PrintSystem = ({ accessToken, userRole }: PrintSystemProps) => {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([])
  const [templates, setTemplates] = useState<PrintTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchPrintJobs()
    fetchTemplates()
  }, [])

  const fetchPrintJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/print/jobs`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPrintJobs(data.printJobs || [])
      }
    } catch (error) {
      console.error('Erro ao carregar jobs de impressão:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/print/templates`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const createPrintJob = async (type: string, data: any, options: Partial<PrintJob> = {}) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/print/jobs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            type,
            data,
            ...options
          })
        }
      )

      if (response.ok) {
        await fetchPrintJobs()
      }
    } catch (error) {
      console.error('Erro ao criar job de impressão:', error)
    }
  }

  const printJob = async (jobId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/print/jobs/${jobId}/print`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        await fetchPrintJobs()
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error)
    }
  }

  const generateSampleLabels = async (appointmentId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/appointments/${appointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const { appointment } = await response.json()
        
        // Create label job for each sample
        appointment.sampleIds?.forEach((sampleId: string, index: number) => {
          createPrintJob('label', {
            sampleId,
            patientName: appointment.patientName,
            serviceName: appointment.services[index]?.name,
            serviceCode: appointment.services[index]?.code,
            collectionDate: new Date().toISOString(),
            qrCode: sampleId
          }, {
            title: `Etiqueta - ${appointment.patientName} - ${sampleId.split('_')[1]}`,
            patientName: appointment.patientName,
            sampleId,
            appointmentId,
            format: 'label-small',
            priority: 'normal',
            copies: 1
          })
        })
      }
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error)
    }
  }

  const generateReceipt = async (appointmentId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/appointments/${appointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const { appointment } = await response.json()
        
        createPrintJob('receipt', appointment, {
          title: `Comprovante - ${appointment.patientName}`,
          patientName: appointment.patientName,
          appointmentId,
          format: 'thermal',
          priority: 'normal',
          copies: 1
        })
      }
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      printing: { color: 'bg-blue-100 text-blue-800', label: 'Imprimindo' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Concluído' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Falha' }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baixa' },
      normal: { color: 'bg-blue-100 text-blue-800', label: 'Normal' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    }
    return configs[priority as keyof typeof configs] || configs.normal
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      label: Tag,
      receipt: Receipt,
      report: FileText,
      result: FileImage
    }
    return icons[type as keyof typeof icons] || FileText
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredJobs = printJobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.sampleId?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesType = typeFilter === 'all' || job.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  if (loading && printJobs.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Sistema de Impressão</h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando jobs de impressão...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Sistema de Impressão</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerenciar impressão de etiquetas, comprovantes e relatórios
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchPrintJobs} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => {
                // In a real app, this would open a dialog to select appointment
                const appointmentId = prompt('ID do Atendimento:')
                if (appointmentId) generateSampleLabels(appointmentId)
              }}
              className="h-20 flex-col"
            >
              <Tag className="w-6 h-6 mb-2" />
              <span>Etiquetas de Amostras</span>
            </Button>
            
            <Button 
              onClick={() => {
                const appointmentId = prompt('ID do Atendimento:')
                if (appointmentId) generateReceipt(appointmentId)
              }}
              variant="outline"
              className="h-20 flex-col"
            >
              <Receipt className="w-6 h-6 mb-2" />
              <span>Comprovante</span>
            </Button>
            
            <Button 
              onClick={() => {
                // This would typically open a report selection dialog
                alert('Função de impressão de relatórios em desenvolvimento')
              }}
              variant="outline"
              className="h-20 flex-col"
            >
              <FileText className="w-6 h-6 mb-2" />
              <span>Relatório</span>
            </Button>
            
            <Button 
              onClick={() => {
                alert('Função de impressão de resultados em desenvolvimento')
              }}
              variant="outline"
              className="h-20 flex-col"
            >
              <FileImage className="w-6 h-6 mb-2" />
              <span>Resultado de Exame</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por título, paciente ou amostra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="label">Etiquetas</SelectItem>
                  <SelectItem value="receipt">Comprovantes</SelectItem>
                  <SelectItem value="report">Relatórios</SelectItem>
                  <SelectItem value="result">Resultados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="printing">Imprimindo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Fila de Impressão</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const statusConfig = getStatusConfig(job.status)
              const priorityConfig = getPriorityConfig(job.priority)
              const TypeIcon = getTypeIcon(job.type)

              return (
                <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <TypeIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{job.title}</h4>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                          <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Tipo:</span> {job.type}
                          </div>
                          <div>
                            <span className="font-medium">Formato:</span> {job.format}
                          </div>
                          <div>
                            <span className="font-medium">Cópias:</span> {job.copies}
                          </div>
                          <div>
                            <span className="font-medium">Criado:</span> {formatDateTime(job.createdAt)}
                          </div>
                        </div>
                        
                        {job.patientName && (
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            <span>{job.patientName}</span>
                            {job.sampleId && (
                              <>
                                <QrCode className="w-3 h-3 ml-2" />
                                <span>{job.sampleId.split('_')[1]}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedJob(job)
                          setShowPreview(true)
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      
                      {job.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => printJob(job.id)}
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          Imprimir
                        </Button>
                      )}
                      
                      {job.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printJob(job.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reimprimir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-8">
              <Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Nenhum job de impressão encontrado com os filtros aplicados'
                  : 'Nenhum job de impressão na fila'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total na Fila</p>
                <p className="text-2xl font-bold text-gray-900">
                  {printJobs.filter(job => job.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Printer className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Impressos Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {printJobs.filter(job => 
                    job.status === 'completed' && 
                    job.printedAt?.startsWith(new Date().toISOString().split('T')[0])
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Falhas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {printJobs.filter(job => job.status === 'failed').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Preview de Impressão</h3>
              <Button variant="ghost" onClick={() => setShowPreview(false)}>×</Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{selectedJob.title}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Tipo:</strong> {selectedJob.type}</p>
                  <p><strong>Formato:</strong> {selectedJob.format}</p>
                  <p><strong>Cópias:</strong> {selectedJob.copies}</p>
                  {selectedJob.patientName && <p><strong>Paciente:</strong> {selectedJob.patientName}</p>}
                  {selectedJob.sampleId && <p><strong>Amostra:</strong> {selectedJob.sampleId}</p>}
                </div>
              </div>
              
              <div className="border border-gray-300 p-6 bg-white min-h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Preview do documento seria exibido aqui</p>
                  <p className="text-sm mt-2">Formato: {selectedJob.format}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Fechar
                </Button>
                <Button onClick={() => printJob(selectedJob.id)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}