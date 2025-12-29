
import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { SaleRecord } from '../types';
import { formatCurrency } from '../utils/dataGenerator';

interface ChartsProps {
  data: SaleRecord[];
}

const COLORS = ['#6d47df', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/40">
        <p className="text-sm font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-sm font-medium text-[#6d47df]">{payload[0].name}: {payload[0].value.toLocaleString('pt-BR')}</p>
      </div>
    );
  }
  return null;
};

const ChartsSection: React.FC<ChartsProps> = ({ data }) => {
  // Sales Funnel Data
  const funnelData = useMemo(() => {
    const stages = ['Lead', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'];
    return stages.map(stage => ({
      name: stage,
      value: data.filter(d => d.stage === stage).length,
      amount: data.filter(d => d.stage === stage).reduce((acc, curr) => acc + curr.amount, 0)
    }));
  }, [data]);

  // Stage Distribution Data
  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      counts[d.stage] = (counts[d.stage] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Temporal Evolution Data
  const evolutionData = useMemo(() => {
    const grouped: Record<string, { revenue: number, count: number }> = {};
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedData.forEach(d => {
      const dateLabel = d.date.split('-').slice(1).reverse().join('/'); // DD/MM format
      if (!grouped[dateLabel]) grouped[dateLabel] = { revenue: 0, count: 0 };
      grouped[dateLabel].revenue += (d.status === 'Won' ? d.amount : 0);
      grouped[dateLabel].count += 1;
    });

    return Object.entries(grouped).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      opportunities: stats.count
    })).slice(-15); // Last 15 data points
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Funnel Chart */}
      <div className="lg:col-span-2 glass p-8 rounded-[32px]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Funil de Vendas</h3>
            <p className="text-sm text-slate-500">Conversão por etapa do pipeline</p>
          </div>
          <div className="text-right">
             <span className="text-2xl font-bold text-[#6d47df]">{formatCurrency(data.reduce((a, c) => a + c.amount, 0))}</span>
             <p className="text-xs text-slate-400 font-medium">Pipeline Total</p>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={funnelData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barSize={32}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(109, 71, 223, 0.05)' }} />
              <Bar dataKey="value" name="Volume" radius={[0, 8, 8, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-5 mt-6 border-t border-slate-100 pt-6">
           {funnelData.map((step, idx) => (
             <div key={step.name} className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{step.name}</p>
                <p className="text-sm font-bold text-slate-800">{step.value}</p>
             </div>
           ))}
        </div>
      </div>

      {/* Distribution Pie */}
      <div className="glass p-8 rounded-[32px]">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Distribuição por Etapa</h3>
        <p className="text-sm text-slate-500 mb-6">Equilíbrio da carteira</p>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stageDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {stageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 mt-4">
           {stageDistribution.map((item, idx) => (
             <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                   <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{((item.value / data.length) * 100).toFixed(0)}%</span>
             </div>
           ))}
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="lg:col-span-3 glass p-8 rounded-[32px]">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h3 className="text-lg font-bold text-slate-900">Evolução Temporal</h3>
              <p className="text-sm text-slate-500">Desempenho de vendas e oportunidades</p>
           </div>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-[#6d47df]"></div>
                 <span className="text-xs font-semibold text-slate-500">Receita</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                 <span className="text-xs font-semibold text-slate-500">Oportunidades</span>
              </div>
           </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6d47df" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6d47df" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(val) => `R$${val/1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Receita"
                stroke="#6d47df" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Area 
                type="monotone" 
                dataKey="opportunities" 
                name="Oportunidades"
                stroke="#bfdbfe" 
                strokeWidth={2}
                fill="transparent" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
