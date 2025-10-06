import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { DatePicker } from './ui/calendar'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { 
  FileText,
  Download,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Printer,
  Mail,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface ReportData {
  appointments: any[]
  services: any[]
  patients: any[]
  examResults: any[]
  period: {
    startDate: string
    endDate: string
  }
}

interface ReportsProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

export const Reports = ({ accessToken, userRole }: ReportsProps) => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('general')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/reports/data?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (format: 'pdf' | 'excel') => {
    setGeneratingReport(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/reports/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            type: reportType,
            format,
            dateRange,
            selectedServices,
            includeCharts: true
          })
        }
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio_${reportType}_${dateRange.startDate}_${dateRange.endDate}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    } finally {
      setGeneratingReport(false)
    }
  }

  const getAppointmentsByDay = () => {
    if (!reportData?.appointments) return []
    
    const appointmentsByDay = reportData.appointments.reduce((acc, appointment) => {
      const day = appointment.createdAt.split('T')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})

    return Object.entries(appointmentsByDay).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      atendimentos: count
    }))
  }

  const getRevenueByService = () => {
    if (!reportData?.appointments) return []
    
    const revenueByService = reportData.appointments.reduce((acc, appointment) => {
      appointment.services.forEach((service: any) => {
        const price = service.finalPrice || service.basePrice || 0
        acc[service.name] = (acc[service.name] || 0) + price
      })
      return acc
    }, {})

    return Object.entries(revenueByService)
      .map(([service, revenue]) => ({
        service,
        receita: revenue
      }))
      .sort((a, b) => (b.receita as number) - (a.receita as number))
      .slice(0, 10)
  }

  const getServiceDistribution = () => {
    if (!reportData?.appointments) return []
    
    const serviceCount = reportData.appointments.reduce((acc, appointment) => {
      appointment.services.forEach((service: any) => {
        acc[service.name] = (acc[service.name] || 0) + 1
      })
      return acc
    }, {})

    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']
    
    return Object.entries(serviceCount)
      .map(([name, value], index) => ({
        name,
        value,
        fill: colors[index % colors.length]
      }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 6)
  }

  const getStatusDistribution = () => {
    if (!reportData?.appointments) return []
    
    const statusCount = reportData.appointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1
      return acc
    }, {})

    const colors = {
      'Aguardando Coleta': '#FFA500',
      'Em Análise': '#0088FE',
      'Aguardando Laudo': '#FF8042',
      'Finalizado': '#00C49F'
    }
    
    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      fill: colors[name as keyof typeof colors] || '#8884D8'
    }))
  }

  const getKPIs = () => {
    if (!reportData) return {
      totalAppointments: 0,
      totalRevenue: 0,
      avgTicket: 0,
      completionRate: 0
    }

    const totalAppointments = reportData.appointments.length
    const totalRevenue = reportData.appointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0)
    const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0
    const completedAppointments = reportData.appointments.filter(apt => apt.status === 'Finalizado').length
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0

    return {
      totalAppointments,
      totalRevenue,
      avgTicket,
      completionRate
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const kpis = getKPIs()

  if (loading && !reportData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Relatórios Gerenciais</h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Relatórios Gerenciais</h2>
        <div className="flex space-x-2">
          <Button onClick={fetchReportData} disabled={loading} variant="outline">
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
            <span>Filtros do Relatório</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Relatório Geral</SelectItem>
                  <SelectItem value="financial">Relatório Financeiro</SelectItem>
                  <SelectItem value="operational">Relatório Operacional</SelectItem>
                  <SelectItem value="quality">Relatório de Qualidade</SelectItem>
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

            <div className="flex items-end space-x-2">
              <Button onClick={() => generateReport('pdf')} disabled={generatingReport}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button onClick={() => generateReport('excel')} disabled={generatingReport} variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Atendimentos</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalAppointments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.avgTicket)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.completionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChartIcon className="w-5 h-5" />
              <span>Atendimentos por Dia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getAppointmentsByDay()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="atendimentos" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ fill: '#0088FE' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5" />
              <span>Distribuição de Serviços</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getServiceDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getServiceDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Receita por Serviço</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getRevenueByService()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="service" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="receita" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Distribuição de Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getStatusDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getStatusDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Últimos Atendimentos</h4>
                <div className="space-y-2">
                  {reportData.appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 truncate">{appointment.patientName}</span>
                      <Badge variant="outline">{appointment.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Serviços Mais Solicitados</h4>
                <div className="space-y-2">
                  {getServiceDistribution().slice(0, 5).map((service) => (
                    <div key={service.name} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 truncate">{service.name}</span>
                      <span className="font-medium">{service.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Alertas e Indicadores</h4>
                <div className="space-y-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Taxa de conclusão: {kpis.completionRate.toFixed(1)}%
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Ticket médio: {formatCurrency(kpis.avgTicket)}
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => generateReport('pdf')} 
              disabled={generatingReport}
              className="flex-1 md:flex-initial"
            >
              <FileText className="w-4 h-4 mr-2" />
              {generatingReport ? 'Gerando...' : 'Exportar PDF'}
            </Button>
            
            <Button 
              onClick={() => generateReport('excel')} 
              disabled={generatingReport}
              variant="outline"
              className="flex-1 md:flex-initial"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {generatingReport ? 'Gerando...' : 'Exportar Excel'}
            </Button>
            
            <Button variant="outline" className="flex-1 md:flex-initial">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            
            <Button variant="outline" className="flex-1 md:flex-initial">
              <Mail className="w-4 h-4 mr-2" />
              Enviar por Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}