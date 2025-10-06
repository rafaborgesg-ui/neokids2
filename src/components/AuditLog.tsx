import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Eye,
  AlertTriangle,
  Clock,
  FileText,
  Database,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userEmail: string
  userName: string
  userRole: string
  action: string
  resource: string
  resourceId: string
  details: {
    oldValue?: any
    newValue?: any
    metadata?: any
  }
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  status: 'success' | 'failure' | 'warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface AuditLogProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

export const AuditLog = ({ accessToken, userRole }: AuditLogProps) => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (userRole === 'administrador') {
      fetchAuditLog()
    }
  }, [userRole, dateRange])

  useEffect(() => {
    filterEntries()
  }, [auditEntries, searchQuery, actionFilter, severityFilter])

  const fetchAuditLog = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/audit/log?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAuditEntries(data.auditEntries || [])
      }
    } catch (error) {
      console.error('Erro ao carregar log de auditoria:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEntries = () => {
    let filtered = auditEntries

    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.resourceId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(entry => entry.action === actionFilter)
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(entry => entry.severity === severityFilter)
    }

    setFilteredEntries(filtered)
  }

  const exportAuditLog = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/audit/export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            dateRange,
            filters: { action: actionFilter, severity: severityFilter }
          })
        }
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit_log_${dateRange.startDate}_${dateRange.endDate}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erro ao exportar log de auditoria:', error)
    }
  }

  const getActionConfig = (action: string) => {
    const configs = {
      'login': { icon: User, color: 'bg-blue-100 text-blue-800', label: 'Login' },
      'logout': { icon: User, color: 'bg-gray-100 text-gray-800', label: 'Logout' },
      'create': { icon: Settings, color: 'bg-green-100 text-green-800', label: 'Criar' },
      'update': { icon: Settings, color: 'bg-yellow-100 text-yellow-800', label: 'Atualizar' },
      'delete': { icon: Settings, color: 'bg-red-100 text-red-800', label: 'Excluir' },
      'view': { icon: Eye, color: 'bg-gray-100 text-gray-800', label: 'Visualizar' },
      'export': { icon: Download, color: 'bg-purple-100 text-purple-800', label: 'Exportar' },
      'print': { icon: FileText, color: 'bg-indigo-100 text-indigo-800', label: 'Imprimir' }
    }
    return configs[action as keyof typeof configs] || { 
      icon: Activity, 
      color: 'bg-gray-100 text-gray-800', 
      label: action 
    }
  }

  const getSeverityConfig = (severity: string) => {
    const configs = {
      low: { color: 'bg-green-100 text-green-800', label: 'Baixa' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Média' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Crítica' }
    }
    return configs[severity as keyof typeof configs] || configs.low
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      success: { color: 'bg-green-100 text-green-800', label: 'Sucesso' },
      failure: { color: 'bg-red-100 text-red-800', label: 'Falha' },
      warning: { color: 'bg-yellow-100 text-yellow-800', label: 'Aviso' }
    }
    return configs[status as keyof typeof configs] || configs.success
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getResourceLabel = (resource: string) => {
    const labels = {
      'patient': 'Paciente',
      'appointment': 'Atendimento',
      'service': 'Serviço',
      'exam_result': 'Resultado de Exame',
      'user': 'Usuário',
      'system': 'Sistema'
    }
    return labels[resource as keyof typeof labels] || resource
  }

  // Only allow access for administrators
  if (userRole !== 'administrador') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Log de Auditoria</h2>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso restrito. Apenas administradores podem visualizar o log de auditoria.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading && auditEntries.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Log de Auditoria</h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando log de auditoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Log de Auditoria</h2>
          <p className="text-sm text-gray-600 mt-1">
            Rastreamento completo de ações no sistema para conformidade e segurança
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportAuditLog} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={fetchAuditLog} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros de Auditoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  className="pl-10"
                  placeholder="Usuário, ação, recurso..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Criar</SelectItem>
                  <SelectItem value="update">Atualizar</SelectItem>
                  <SelectItem value="delete">Excluir</SelectItem>
                  <SelectItem value="view">Visualizar</SelectItem>
                  <SelectItem value="export">Exportar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Severidade</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Data Inicial</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Data Final</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                <p className="text-2xl font-bold text-gray-900">{filteredEntries.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Únicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredEntries.map(e => e.userId)).size}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Críticos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredEntries.filter(e => e.severity === 'critical').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
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
                  {filteredEntries.filter(e => e.status === 'failure').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              const actionConfig = getActionConfig(entry.action)
              const severityConfig = getSeverityConfig(entry.severity)
              const statusConfig = getStatusConfig(entry.status)
              const ActionIcon = actionConfig.icon

              return (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${actionConfig.color.split(' ')[0]}-100`}>
                        <ActionIcon className={`w-4 h-4 ${actionConfig.color.split(' ')[1]}-600`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{entry.userName}</h4>
                          <Badge className={actionConfig.color}>{actionConfig.label}</Badge>
                          <Badge className={severityConfig.color}>{severityConfig.label}</Badge>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {actionConfig.label} {getResourceLabel(entry.resource)}
                          {entry.resourceId && ` (ID: ${entry.resourceId.split('_')[1] || entry.resourceId})`}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDateTime(entry.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{entry.userEmail}</span>
                          </div>
                          {entry.ipAddress && (
                            <div className="flex items-center space-x-1">
                              <Database className="w-3 h-3" />
                              <span>{entry.ipAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEntry(entry)
                        setShowDetails(true)
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredEntries.length === 0 && !loading && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery || actionFilter !== 'all' || severityFilter !== 'all'
                  ? 'Nenhum evento encontrado com os filtros aplicados'
                  : 'Nenhum evento de auditoria encontrado'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal/Dialog would go here */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detalhes do Evento de Auditoria</h3>
              <Button variant="ghost" onClick={() => setShowDetails(false)}>×</Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedEntry.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Usuário</label>
                  <p className="text-sm text-gray-900">{selectedEntry.userName} ({selectedEntry.userEmail})</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Ação</label>
                  <p className="text-sm text-gray-900">{selectedEntry.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Recurso</label>
                  <p className="text-sm text-gray-900">{getResourceLabel(selectedEntry.resource)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID do Recurso</label>
                  <p className="text-sm text-gray-900">{selectedEntry.resourceId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge className={getStatusConfig(selectedEntry.status).color}>
                    {getStatusConfig(selectedEntry.status).label}
                  </Badge>
                </div>
              </div>
              
              {selectedEntry.details && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Detalhes Técnicos</label>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedEntry.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Endereço IP</label>
                  <p className="text-sm text-gray-900">{selectedEntry.ipAddress}</p>
                </div>
              )}
              
              {selectedEntry.userAgent && (
                <div>
                  <label className="text-sm font-medium text-gray-700">User Agent</label>
                  <p className="text-xs text-gray-700">{selectedEntry.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}