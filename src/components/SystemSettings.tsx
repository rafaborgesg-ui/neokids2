import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { 
  Users,
  Building,
  Bell,
  Shield
} from 'lucide-react';

interface SystemSettingsProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

const SettingsSection = ({ title, description, icon: Icon, children }: { title: string, description: string, icon: React.ElementType, children: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-x-4">
      <Icon className="w-8 h-8 text-gray-500" />
      <div>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export const SystemSettings = ({ userRole, onNavigate }: SystemSettingsProps) => {
  // Somente administradores podem ver esta página
  if (userRole !== 'administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para acessar as configurações do sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h2>
      
      <SettingsSection
        title="Gerenciamento de Usuários"
        description="Adicione, remova ou edite os usuários e suas permissões."
        icon={Users}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Novo Convite</p>
            <Button>Convidar Usuário</Button>
          </div>
          <Separator />
          <div>
            <Label htmlFor="search-user">Buscar Usuário</Label>
            <Input id="search-user" placeholder="Buscar por nome ou email..." />
          </div>
          <div className="text-center text-sm text-gray-500 py-4">
            (Funcionalidade de gerenciamento de usuários a ser implementada)
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Unidades e Filiais"
        description="Gerencie as informações das unidades da clínica."
        icon={Building}
      >
        <div className="text-center text-sm text-gray-500 py-4">
          (Funcionalidade de gerenciamento de unidades a ser implementada)
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notificações e Alertas"
        description="Configure os gatilhos e canais para notificações automáticas."
        icon={Bell}
      >
        <div className="text-center text-sm text-gray-500 py-4">
          (Funcionalidade de gerenciamento de notificações a ser implementada)
        </div>
      </SettingsSection>
    </div>
  );
};