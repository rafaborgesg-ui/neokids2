import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuditLogs, AuditLogEntry } from '../hooks/useAuditLogs';
import { Loader2, Shield, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Eye } from 'lucide-react';
import { format } from 'date-fns';

// Componente para renderizar as diferenças entre dados antigos e novos
const DataDiff = ({ oldData, newData }: { oldData?: any; newData?: any }) => {
  if (!oldData && !newData) return <p>Nenhum dado para exibir.</p>;

  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
  const ignoredKeys = ['created_at', 'updated_at']; // Campos que não queremos mostrar

  return (
    <div className="space-y-2 font-mono text-xs">
      {Array.from(allKeys).filter(key => !ignoredKeys.includes(key)).map(key => {
        const oldValue = oldData?.[key];
        const newValue = newData?.[key];
        const isChanged = oldValue !== newValue;

        if (!isChanged) {
          return (
            <div key={key} className="flex">
              <span className="w-1/3 text-gray-500 truncate">{key}:</span>
              <span className="w-2/3 truncate">{JSON.stringify(newValue)}</span>
            </div>
          );
        }

        return (
          <div key={key}>
            <div className="flex">
              <span className="w-1/3 text-gray-500 truncate">{key}:</span>
              <span className="w-2/3 text-red-600 truncate line-through">{JSON.stringify(oldValue)}</span>
            </div>
            <div className="flex">
              <span className="w-1/3"></span>
              <span className="w-2/3 text-green-600 truncate">{JSON.stringify(newValue)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface AuditLogProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

const ActionBadge = ({ action }: { action: AuditLogEntry['action'] }) => {
  const colors = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };
  return <Badge className={colors[action]}>{action}</Badge>;
};

export const AuditLog = ({ userRole, onNavigate }: AuditLogProps) => {
  const { logs, count, loading, fetchLogs } = useAuditLogs();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [tableFilter, setTableFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchLogs({ page, perPage, tableName: tableFilter });
  }, [page, perPage, tableFilter, fetchLogs]);

  if (userRole !== 'administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para visualizar os logs de auditoria.</p>
      </div>
    );
  }

  const totalPages = count ? Math.ceil(count / perPage) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Log de Auditoria</h2>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filtros</CardTitle>
            <Select onValueChange={(value: string) => setTableFilter(value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Tabelas</SelectItem>
                <SelectItem value="patients">Pacientes</SelectItem>
                <SelectItem value="appointments">Atendimentos</SelectItem>
                <SelectItem value="services">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <Loader2 className="animate-spin mx-auto" />}
          {!loading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss')}</TableCell>
                    <TableCell>{log.user_email || 'Sistema'}</TableCell>
                    <TableCell><ActionBadge action={log.action} /></TableCell>
                    <TableCell>{log.table_name}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes da Alteração</DialogTitle>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Dados Antigos</h4>
                              <DataDiff oldData={log.old_record_data} newData={null} />
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Dados Novos</h4>
                              <DataDiff oldData={null} newData={log.new_record_data} />
                            </div>
                             <div>
                              <h4 className="font-semibold mb-2">Diferenças</h4>
                              <DataDiff oldData={log.old_record_data} newData={log.new_record_data} />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Página {page} de {totalPages} ({count || 0} registros)
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};