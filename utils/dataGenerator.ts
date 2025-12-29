
import { SaleRecord, Pipeline, Activity, Task } from '../types';

export const DEFAULT_STAGES = [
  'Preencheu formulário', 
  'Em Contato', 
  'Reunião Agendada', 
  'Reunião Confirmada', 
  'Aguardando Pagamento', 
  'Fechado', 
  'Pago',
  'Nutrição'
];

export const generateInitialPipelines = (): Pipeline[] => [
  { id: 'p1', name: 'Vendas Inbound' },
  { id: 'p2', name: 'Vendas Outbound' },
  { id: 'p3', name: 'Parcerias' }
];

const generateActivities = (owner: string): Activity[] => [
  {
    id: `act-${Math.random()}`,
    type: 'Automation',
    description: 'Lead capturado via formulário do site.',
    date: new Date().toISOString(),
    owner: 'System'
  },
  {
    id: `act-${Math.random()}`,
    type: 'Call',
    description: 'Primeiro contato realizado. Demonstrou interesse no plano Premium.',
    date: new Date(Date.now() - 86400000).toISOString(),
    owner
  }
];

const generateTasks = (): Task[] => [
  {
    id: `task-${Math.random()}`,
    title: 'Enviar proposta comercial',
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    completed: false,
    priority: 'High'
  }
];

export const generateMockData = (pipelines: Pipeline[]): SaleRecord[] => {
  const owners = ['Ana Silva', 'Bruno Costa', 'Carla Mendes', 'Diego Santos'];
  const sources: SaleRecord['source'][] = ['Facebook', 'Instagram', 'Meta Ads', 'Google', 'Direct'];
  const companies = ['Personal Care', 'Health Domiciliar', 'Grupo CHC Saúde', 'Anjos do bem Home care', 'ACG Home Care PR'];
  
  return Array.from({ length: 30 }).map((_, i) => {
    const owner = owners[Math.floor(Math.random() * owners.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const stage = DEFAULT_STAGES[Math.floor(Math.random() * (DEFAULT_STAGES.length - 2))];

    return {
      id: `lead-${Date.now()}-${i}`,
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 15000) + 1000,
      status: (stage === 'Pago' || stage === 'Fechado') ? 'Won' : 'Open',
      stage,
      owner,
      pipelineId: pipelines[Math.floor(Math.random() * pipelines.length)].id,
      commercialName: companies[Math.floor(Math.random() * companies.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      activities: generateActivities(owner),
      tasks: generateTasks(),
      tags: ['Prioridade', 'Lead Quente'],
      score: Math.floor(Math.random() * 100),
      contact: {
        id: `ct-${i}`,
        name: `Lead ${i}`,
        email: `contato${i}@empresa.com.br`,
        phone: '(11) 98888-7777'
      }
    };
  });
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: val > 20000 ? 'compact' : 'standard',
  }).format(val);
};

export const formatPercent = (val: number) => {
  return `${val.toFixed(1)}%`;
};
