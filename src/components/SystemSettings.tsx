import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useUserManagement, AppUser } from '../hooks/useUserManagement';
import { Loader2, Users, Trash2, Shield, Send, Plus, ArrowLeft } from 'lucide-react';

// Componente de Formulário para Novo Usuário
const NewUserForm = ({ onSave, onCancel, loading }: { onSave: (data: any) => void, onCancel: () => void, loading: boolean }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'atendente' });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="new-name">Nome Completo *</Label>
        <Input id="new-name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-email">Email *</Label>
        <Input id="new-email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Senha Provisória *</Label>
        <Input id="new-password" type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-role">Função</Label>
        <Select value={formData.role} onValueChange={value => handleChange('role', value)}>
          <SelectTrigger id="new-role"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="atendente">Atendente</SelectItem>
            <SelectItem value="tecnico">Técnico</SelectItem>
            <SelectItem value="administrador">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  );
};

interface SystemSettingsProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const SystemSettings = ({ userRole }: SystemSettingsProps) => {
  const { users, loading, error, listUsers, updateUserRole, deleteUser, inviteUser, createUser } = useUserManagement();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('atendente');

  useEffect(() => {
    if (userRole === 'administrador') {
      listUsers();
    }
  }, [userRole, listUsers]);

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole(userId, newRole);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    await inviteUser(inviteEmail, inviteRole);
    setInviteEmail('');
  };

  const handleCreateUser = async (data: any) => {
    await createUser(data);
    setView('list');
  };

  if (userRole !== 'administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para acessar as configurações do sistema.</p>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setView('list')} className="mr-2">
              <ArrowLeft />
            </Button>
            Adicionar Novo Usuário
          </CardTitle>
          <CardDescription>
            Crie uma nova conta de usuário manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewUserForm 
            onSave={handleCreateUser}
            onCancel={() => setView('list')}
            loading={loading}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Configurações do Sistema</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="mr-2" />
            Convidar Novo Usuário
          </CardTitle>
          <CardDescription>
            Envie um convite por email para um novo membro da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input 
                id="invite-email" 
                type="email" 
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Função</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="atendente">Atendente</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleInvite} disabled={loading || !inviteEmail}>
            {loading ? <Loader2 className="animate-spin" /> : 'Enviar Convite'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="flex items-center">
                <Users className="mr-2" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Edite as permissões de acesso dos usuários do sistema.
              </CardDescription>
            </div>
            <Button onClick={() => setView('new')}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 && <Loader2 className="animate-spin mx-auto" />}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: AppUser) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.user_metadata.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.user_metadata.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="atendente">Atendente</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário {user.email}? Esta ação é irreversível.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUser(user.id)}>Excluir</AlertDialogAction>
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