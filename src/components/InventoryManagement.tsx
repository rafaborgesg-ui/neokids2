import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { useInventory, NewInventoryItem, InventoryItem } from '../hooks/useInventory';
import { Loader2, Package, Plus, Edit, Trash2, Shield } from 'lucide-react';

interface InventoryManagementProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const InventoryManagement = ({ userRole }: InventoryManagementProps) => {
  const { items, loading, fetchItems, createItem, updateItem, deleteItem } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<NewInventoryItem>>({});

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenDialog = (item: InventoryItem | null = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item } : { name: '', quantity: 0, low_stock_threshold: 10, unit: 'unidades' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return; // Simple validation

    if (editingItem) {
      await updateItem(editingItem.id, formData);
    } else {
      await createItem(formData as NewInventoryItem);
    }
    setIsDialogOpen(false);
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.low_stock_threshold;

  if (userRole !== 'administrador' && userRole !== 'tecnico') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para gerenciar o estoque.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Gerenciamento de Estoque</h2>
        <Button onClick={() => handleOpenDialog()}>
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
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>
                      {isLowStock(item) ? (
                        <Badge variant="destructive">Estoque Baixo</Badge>
                      ) : (
                        <Badge variant="default">Em Estoque</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(item)}><Edit className="w-4 h-4" /></Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item de Estoque'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Item</Label>
              <Input id="name" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" type="number" value={formData.quantity || 0} onChange={e => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input id="unit" value={formData.unit || ''} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Alerta de Estoque Baixo</Label>
              <Input id="low_stock_threshold" type="number" value={formData.low_stock_threshold || 0} onChange={e => setFormData(p => ({ ...p, low_stock_threshold: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};