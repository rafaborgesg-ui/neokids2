import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  User,
  Activity,
  FileImage,
  FilePdf,
  Printer,
  Send
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface ExamResult {
  id: string
  appointmentId: string
  patientName: string
  patientId: string
  serviceId: string
  serviceName: string
  serviceCode: string
  sampleId: string
  status: 'pending' | 'completed' | 'validated' | 'released'
  resultType: 'numeric' | 'text' | 'image' | 'file'
  results: {
    values?: Array<{
      parameter: string
      value: string
      unit: string
      referenceRange: string
      status: 'normal' | 'high' | 'low' | 'critical'
    }>
    observation?: string
    conclusion?: string
    files?: Array<{
      name: string
      type: string
      url: string
      size: number
    }>
  }
  technicianId?: string
  technicianName?: string
  validatedBy?: string
  validatedAt?: string
  completedAt?: string
  releasedAt?: string
  createdAt: string
}

interface ExamResultsProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

export const ExamResults = ({ accessToken, userRole }: ExamResultsProps) => {
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [editingResult, setEditingResult] = useState<Partial<ExamResult> | null>(null)

  // New result form state
  const [newResult, setNewResult] = useState({
    parameter: '',
    value: '',
    unit: '',
    referenceRange: '',
    status: 'normal' as 'normal' | 'high' | 'low' | 'critical'
  })

  useEffect(() => {
    fetchExamResults()
  }, [])

  useEffect(() => {
    filterResults()
  }, [examResults, searchQuery, statusFilter])

  const fetchExamResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/exam-results`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setExamResults(data.examResults || [])
      }
    } catch (error) {
      console.error('Erro ao carregar resultados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResults = () => {
    let filtered = examResults

    if (searchQuery) {
      filtered = filtered.filter(result => 
        result.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.serviceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.sampleId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter)
    }

    setFilteredResults(filtered)
  }

  const addResultValue = () => {
    if (!editingResult || !newResult.parameter || !newResult.value) return

    const updatedResults = {
      ...editingResult.results,
      values: [
        ...(editingResult.results?.values || []),
        { ...newResult }
      ]
    }

    setEditingResult({
      ...editingResult,
      results: updatedResults
    })

    // Reset form
    setNewResult({
      parameter: '',
      value: '',
      unit: '',
      referenceRange: '',
      status: 'normal'
    })
  }

  const saveResult = async () => {
    if (!editingResult?.id) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/exam-results/${editingResult.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            results: editingResult.results,
            status: 'completed',
            completedAt: new Date().toISOString()
          })
        }
      )

      if (response.ok) {
        await fetchExamResults()
        setEditingResult(null)
        setShowResultDialog(false)
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error)
    }
  }

  const validateResult = async (resultId: string) => {
    if (userRole !== 'administrador') return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/exam-results/${resultId}/validate`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        await fetchExamResults()
      }
    } catch (error) {
      console.error('Erro ao validar resultado:', error)
    }
  }

  const releaseResult = async (resultId: string) => {
    if (userRole !== 'administrador') return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/exam-results/${resultId}/release`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        await fetchExamResults()
      }
    } catch (error) {
      console.error('Erro ao liberar resultado:', error)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: 'Pendente', 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertCircle 
      },
      completed: { 
        label: 'Completo', 
        color: 'bg-blue-100 text-blue-800', 
        icon: FileText 
      },
      validated: { 
        label: 'Validado', 
        color: 'bg-purple-100 text-purple-800', 
        icon: CheckCircle 
      },
      released: { 
        label: 'Liberado', 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle 
      }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const getValueStatusColor = (status: string) => {
    const colors = {
      normal: 'text-green-600',
      high: 'text-orange-600',
      low: 'text-blue-600',
      critical: 'text-red-600 font-bold'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600'
  }

  const canEdit = userRole === 'tecnico' || userRole === 'administrador'
  const canValidate = userRole === 'administrador'

  if (loading && examResults.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Resultados de Exames</h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Resultados de Exames</h2>
        <div className="flex space-x-2">
          <Button onClick={fetchExamResults} disabled={loading} variant="outline">
            <Activity className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
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
                  placeholder="Buscar por paciente, serviço ou amostra..."
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
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="completed">Completos</SelectItem>
                  <SelectItem value="validated">Validados</SelectItem>
                  <SelectItem value="released">Liberados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="grid gap-4">
        {filteredResults.map((result) => {
          const statusConfig = getStatusConfig(result.status)
          const StatusIcon = statusConfig.icon

          return (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{result.patientName}</span>
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <p className="flex items-center space-x-2">
                            <FileText className="w-3 h-3" />
                            <span>{result.serviceName} ({result.serviceCode})</span>
                          </p>
                          <p className="flex items-center space-x-2 mt-1">
                            <Activity className="w-3 h-3" />
                            <span>Amostra: {result.sampleId.split('_')[1]}</span>
                          </p>
                          <p className="flex items-center space-x-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateTime(result.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        
                        {result.results?.values && result.results.values.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {result.results.values.length} parâmetro(s)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Result Summary */}
                    {result.results?.values && result.results.values.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Resumo dos Resultados:</h4>
                        <div className="space-y-1">
                          {result.results.values.slice(0, 3).map((value, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{value.parameter}:</span>
                              <span className={`font-medium ${getValueStatusColor(value.status)}`}>
                                {value.value} {value.unit}
                              </span>
                            </div>
                          ))}
                          {result.results.values.length > 3 && (
                            <div className="text-xs text-gray-500 mt-1">
                              +{result.results.values.length - 3} parâmetros adicionais
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Dialog open={showResultDialog && selectedResult?.id === result.id} onOpenChange={(open) => {
                        setShowResultDialog(open)
                        if (!open) {
                          setSelectedResult(null)
                          setEditingResult(null)
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedResult(result)
                              setEditingResult(result)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {result.status === 'pending' && canEdit ? 'Inserir Resultado' : 'Visualizar'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Resultado do Exame - {result.serviceName}
                            </DialogTitle>
                            <DialogDescription>
                              Visualize os detalhes completos e edite os resultados do exame.
                            </DialogDescription>
                          </DialogHeader>
                          <ResultDetailsDialog 
                            result={result}
                            editingResult={editingResult}
                            setEditingResult={setEditingResult}
                            newResult={newResult}
                            setNewResult={setNewResult}
                            onAddValue={addResultValue}
                            onSave={saveResult}
                            canEdit={canEdit && result.status === 'pending'}
                            getValueStatusColor={getValueStatusColor}
                          />
                        </DialogContent>
                      </Dialog>

                      {result.status === 'completed' && canValidate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateResult(result.id)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validar
                        </Button>
                      )}

                      {result.status === 'validated' && canValidate && (
                        <Button
                          size="sm"
                          onClick={() => releaseResult(result.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Liberar
                        </Button>
                      )}

                      {result.status === 'released' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredResults.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' 
                ? 'Nenhum resultado encontrado com os filtros aplicados'
                : 'Nenhum resultado de exame encontrado'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Component for result details dialog
const ResultDetailsDialog = ({ 
  result, 
  editingResult, 
  setEditingResult, 
  newResult, 
  setNewResult, 
  onAddValue, 
  onSave, 
  canEdit,
  getValueStatusColor 
}: any) => {
  return (
    <div className="space-y-6">
      {/* Patient Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Informações do Paciente</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Nome:</span>
            <p className="text-blue-900">{result.patientName}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Exame:</span>
            <p className="text-blue-900">{result.serviceName}</p>
          </div>
        </div>
      </div>

      {/* Current Results */}
      {editingResult?.results?.values && editingResult.results.values.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Resultados</h3>
          <div className="space-y-2">
            {editingResult.results.values.map((value: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Parâmetro</span>
                    <p className="font-medium">{value.parameter}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Valor</span>
                    <p className={`font-medium ${getValueStatusColor(value.status)}`}>
                      {value.value} {value.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Referência</span>
                    <p className="text-sm text-gray-700">{value.referenceRange}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <Badge variant="outline" className={getValueStatusColor(value.status)}>
                      {value.status}
                    </Badge>
                  </div>
                </div>
                {canEdit && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      const updatedValues = editingResult.results.values.filter((_: any, i: number) => i !== index)
                      setEditingResult({
                        ...editingResult,
                        results: { ...editingResult.results, values: updatedValues }
                      })
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Result (if can edit) */}
      {canEdit && (
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Adicionar Resultado</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Parâmetro</label>
              <Input
                value={newResult.parameter}
                onChange={(e) => setNewResult({...newResult, parameter: e.target.value})}
                placeholder="Ex: Hemoglobina"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valor</label>
              <Input
                value={newResult.value}
                onChange={(e) => setNewResult({...newResult, value: e.target.value})}
                placeholder="Ex: 12.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Unidade</label>
              <Input
                value={newResult.unit}
                onChange={(e) => setNewResult({...newResult, unit: e.target.value})}
                placeholder="Ex: g/dL"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valor de Referência</label>
              <Input
                value={newResult.referenceRange}
                onChange={(e) => setNewResult({...newResult, referenceRange: e.target.value})}
                placeholder="Ex: 12.0 - 15.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={newResult.status} onValueChange={(value: any) => setNewResult({...newResult, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={onAddValue} disabled={!newResult.parameter || !newResult.value}>
                <Upload className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
          
          {/* Observation */}
          <div>
            <label className="text-sm font-medium text-gray-700">Observações</label>
            <Textarea
              value={editingResult?.results?.observation || ''}
              onChange={(e) => setEditingResult({
                ...editingResult,
                results: { ...editingResult.results, observation: e.target.value }
              })}
              placeholder="Observações sobre o exame..."
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Conclusion */}
      {(editingResult?.results?.observation || editingResult?.results?.conclusion) && (
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Observações e Conclusões</h3>
          {editingResult.results.observation && (
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Observações:</span>
              <p className="text-sm text-gray-900 mt-1">{editingResult.results.observation}</p>
            </div>
          )}
          {editingResult.results.conclusion && (
            <div>
              <span className="text-sm font-medium text-gray-700">Conclusão:</span>
              <p className="text-sm text-gray-900 mt-1">{editingResult.results.conclusion}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end space-x-2 border-t pt-4">
          <Button variant="outline">
            Salvar Rascunho
          </Button>
          <Button onClick={onSave}>
            Finalizar Resultado
          </Button>
        </div>
      )}
    </div>
  )
}