import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Plus, 
  Settings, 
  DollarSign, 
  Clock, 
  FileText,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import { useServices, NewService, Service } from '../hooks/useServices'; // Importar o hook e o tipo Service

// A interface Service agora vem do hook

interface ServiceManagementProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const ServiceManagement = ({ userRole, onNavigate }: ServiceManagementProps) => {
  // Usar o hook para gerenciar estado e lógica de dados
  const {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService, // Adicionaremos a lógica de update/delete em breve
    deleteService,
  } = useServices();

  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  
  // Estado para o formulário de novo serviço
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    category: '',
    code: '',
    base_price: '',
    operational_cost: '',
    estimated_time: '',
    instructions: ''
  });

  const categories = [
    'Análises Clínicas',
    'Exames de Imagem',
    'Vacinas',
    'Consultas',
    'Procedimentos'
  ]

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCreateService = async () => {
    // Validação simples
    if (!newServiceForm.name || !newServiceForm.code || !newServiceForm.category || !newServiceForm.base_price) {
      // Idealmente, usar um sistema de notificação como o useToast
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const serviceData: NewService = {
      name: newServiceForm.name,
      category: newServiceForm.category,
      code: newServiceForm.code,
      base_price: parseFloat(newServiceForm.base_price),
      operational_cost: parseFloat(newServiceForm.operational_cost) || 0,
      estimated_time: newServiceForm.estimated_time,
      instructions: newServiceForm.instructions,
    };

    const newService = await createService(serviceData);

    if (newService) {
      setIsNewServiceOpen(false);
      resetNewServiceForm();
    } else {
      // Tratar erro (ex: exibir toast)
      alert("Erro ao criar o serviço.");
    }
  }

  const resetNewServiceForm = () => {
    setNewServiceForm({
      name: '',
      category: '',
      code: '',
      base_price: '',
      operational_cost: '',
      estimated_time: '',
      instructions: ''
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const calculateMargin = (basePrice: number, operationalCost: number) => {
    if (!basePrice || basePrice === 0) return 0
    return ((basePrice - operationalCost) / basePrice * 100).toFixed(1)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Análises Clínicas': 'bg-blue-100 text-blue-800',
      'Exames de Imagem': 'bg-green-100 text-green-800',
      'Vacinas': 'bg-purple-100 text-purple-800',
      'Consultas': 'bg-yellow-100 text-yellow-800',
      'Procedimentos': 'bg-red-100 text-red-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Catálogo de Serviços</h2>
        
        <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Serviço</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo serviço que será adicionado ao catálogo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    value={newServiceForm.name}
                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Hemograma Completo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={newServiceForm.code}
                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ex: HG001"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={newServiceForm.category}
                    onValueChange={(value: string) => setNewServiceForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Preço Base (R$) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    value={newServiceForm.base_price}
                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, base_price: e.target.value }))}
                    placeholder="0,00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="operationalCost">Custo Operacional (R$)</Label>
                  <Input
                    id="operationalCost"
                    type="number"
                    step="0.01"
                    value={newServiceForm.operational_cost}
                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, operational_cost: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="estimatedTime">Tempo Estimado para Resultado</Label>
                  <Input
                    id="estimatedTime"
                    value={newServiceForm.estimated_time}
                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, estimated_time: e.target.value }))}
                    placeholder="Ex: 2-4 horas, 1 dia útil, 24-48 horas"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções de Preparo</Label>
                <Textarea
                  id="instructions"
                  value={newServiceForm.instructions}
                  onChange={(e) => setNewServiceForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instruções detalhadas para o paciente (jejum, medicações, etc.)"
                  rows={4}
                />
              </div>
              
              {newServiceForm.base_price && newServiceForm.operational_cost && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Análise Financeira</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Margem de Contribuição</p>
                        <p className="font-semibold text-blue-900">
                          {calculateMargin(parseFloat(newServiceForm.base_price), parseFloat(newServiceForm.operational_cost))}%
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Lucro por Serviço</p>
                        <p className="font-semibold text-blue-900">
                          {formatCurrency(parseFloat(newServiceForm.base_price) - parseFloat(newServiceForm.operational_cost))}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">ROI</p>
                        <p className="font-semibold text-blue-900">
                          {parseFloat(newServiceForm.operational_cost) ? 
                            ((parseFloat(newServiceForm.base_price) / parseFloat(newServiceForm.operational_cost)) * 100).toFixed(0) + '%' : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewServiceOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateService} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : 'Criar Serviço'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      {loading && services.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando serviços...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getCategoryColor(service.category)}>
                        {service.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {service.code}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá deletar permanentemente o serviço "{service.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteService(service.id)}>Deletar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Preço Base</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(service.base_price)}
                    </span>
                  </div>
                  
                  {service.operational_cost > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Custo Operacional</span>
                        <span className="text-sm text-red-600">
                          {formatCurrency(service.operational_cost)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Margem</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {calculateMargin(service.base_price, service.operational_cost)}%
                        </span>
                      </div>
                    </>
                  )}
                  
                  {service.estimated_time && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{service.estimated_time}</span>
                    </div>
                  )}
                  
                  {service.instructions && (
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {service.instructions}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Criado em {new Date(service.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {services.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum serviço cadastrado</p>
            <p className="text-sm text-gray-500 mt-2">
              Comece cadastrando os serviços oferecidos pela clínica
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}