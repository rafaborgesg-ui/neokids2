import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useReports, ReportParams } from '../hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, BarChart3, DollarSign } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface ReportsProps {
  userRole: string;
  onNavigate?: (module: string) => void;
}

export const Reports = ({ userRole, onNavigate }: ReportsProps) => {
  const { reportData, loading, fetchReport } = useReports();
  const [metric, setMetric] = useState<ReportParams['metric']>('appointments');
  const [timeUnit, setTimeUnit] = useState<ReportParams['timeUnit']>('day');
  const [period, setPeriod] = useState(30); // in days

  useEffect(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, period);

    fetchReport({
      metric,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timeUnit,
    });
  }, [metric, timeUnit, period, fetchReport]);

  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), timeUnit === 'day' ? 'dd/MM' : 'MM/yy');
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Relatórios Gerenciais</h2>

      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label>Métrica</label>
            <Select value={metric} onValueChange={(v: ReportParams['metric']) => setMetric(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="appointments">Volume de Atendimentos</SelectItem>
                <SelectItem value="revenue">Receita (Faturamento)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <label>Agrupamento</label>
            <Select value={timeUnit} onValueChange={(v: ReportParams['timeUnit']) => setTimeUnit(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Por Dia</SelectItem>
                <SelectItem value="month">Por Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <label>Período</label>
            <Select value={String(period)} onValueChange={(v) => setPeriod(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {metric === 'appointments' ? <BarChart3 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            <span>
              {metric === 'appointments' ? 'Volume de Atendimentos' : 'Receita'} por {timeUnit === 'day' ? 'Dia' : 'Mês'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickFormatter={formatXAxis} />
                <YAxis tickFormatter={metric === 'revenue' ? formatCurrency : undefined} />
                <Tooltip 
                  labelFormatter={formatXAxis}
                  formatter={(value: number) => [
                    metric === 'revenue' ? formatCurrency(value) : value,
                    metric === 'revenue' ? 'Receita' : 'Atendimentos'
                  ]}
                />
                <Legend />
                <Bar dataKey="value" name={metric === 'revenue' ? 'Receita' : 'Atendimentos'} fill={metric === 'revenue' ? '#82ca9d' : '#8884d8'} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};