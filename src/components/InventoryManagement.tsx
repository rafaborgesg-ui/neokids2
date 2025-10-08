import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { useInventory, NewInventoryItem, InventoryItem, UpdateInventoryItem } from '../hooks/useInventory';
import { Loader2, Package, Plus, Edit, Trash2, Shield, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

// Componente de Formulário reutilizável
const InventoryForm = ({ item, onSave, onCancel, loading }: { item: Partial<InventoryItem>, onSave: (data: any) => void, onCancel: () => void, loading: boolean }) => {
  const [formData, setFormData] = useState(item);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleChange = (field: string, value: any) => {
    // Garante que campos numéricos sejam tratados corretamente
    if (field === 'quantity' || field === 'alert_level') {
      const numValue = parseInt(value, 10);
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome do Item *</Label>
          <Input id="name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input id="quantity" type="number" value={formData.quantity || 0} onChange={e => handleChange('quantity', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unidade</Label>
          <Input id="unit" value={formData.unit || ''} onChange={e => handleChange('unit', e.target.value)} placeholder="Ex: unidades, caixas" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alert_level">Nível de Alerta *</Label>
          <Input id="alert_level" type="number" value={formData.alert_level || 10} onChange={e => handleChange('alert_level', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier">Fornecedor</Label>
          <Input id="supplier" value={formData.supplier || ''} onChange={e => handleChange('supplier', e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};


interface InventoryManagementProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const InventoryManagement = ({ userRole }: InventoryManagementProps) => {
  const { items, loading, fetchItems, createItem, updateItem, deleteItem } = useInventory();
  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: any) => {
    console.log('[DEBUG] Tentando salvar dados do item:', data); // Log dos dados do formulário
    if (view === 'edit' && editingItem) {
      const { id, created_at, ...updateData } = data;
      await updateItem(editingItem.id, updateData as UpdateInventoryItem);
    } else {
      await createItem(data as NewInventoryItem);
    }
    setView('list');
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setView('edit');
  };

  const handleNew = () => {
    setEditingItem(null);
    setView('new');
  };

  if (userRole !== 'administrador' && userRole !== 'tecnico') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para gerenciar o estoque.</p>
      </div>
    );
  }

  if (view === 'new' || view === 'edit') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setView('list')} className="mr-2">
              <ArrowLeft />
            </Button>
            {view === 'new' ? 'Novo Item de Estoque' : 'Editar Item'}
          </CardTitle>
          <CardDescription>
            {view === 'new' ? 'Preencha os detalhes do novo item.' : 'Atualize os detalhes do item.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryForm 
            item={editingItem || { name: '', quantity: 0, alert_level: 10, unit: 'unidades' }}
            onSave={handleSave}
            onCancel={() => setView('list')}
            loading={loading}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Gerenciamento de Estoque</h2>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>
                      {item.quantity <= item.alert_level ? (
                        <Badge variant="destructive">Estoque Baixo</Badge>
                      ) : (
                        <Badge variant="default">Em Estoque</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o item "{item.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem(item.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};