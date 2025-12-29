
import { SaleRecord, Pipeline, Activity, Task } from '../types';

export const DEFAULT_STAGES = [
  'Capturado',
  'Conversa Iniciada',
  'Orçamento Enviado',
  'Agendado',
  'Concluído'
];

export const generateInitialPipelines = (): Pipeline[] => [
  { id: 'p1', name: 'Vendas Geral' }
];

export const generateMockData = (pipelines: Pipeline[]): SaleRecord[] => {
  // Retorna array vazio para o CRM iniciar limpo conforme solicitado pelo usuário
  return [];
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: val > 100000 ? 'compact' : 'standard',
  }).format(val);
};

export const formatPercent = (val: number) => {
  return `${val.toFixed(1)}%`;
};
