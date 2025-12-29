
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
import { formatCurrency, DEFAULT_STAGES } from '../utils/dataGenerator';
import { TrendingUp, Wallet, ArrowUpRight, Target, Activity } from 'lucide-react';

interface ChartsProps {
  data: SaleRecord[];
  adSpend?: number;
}

const COLORS = ['#6d47df', '#e2e8f0', '#818cf8', '#a5b4fc', '#c7d2fe'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/40">
        <p className="text-sm font-bold text-slate-800 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-medium text-[#6d47df]">{payload[0].value.toLocaleString('pt-BR')}</p>
      </div>
    );
  }
  return null;
};

const ChartsSection: React.FC<ChartsProps> = ({ data, adSpend = 0 }) => {
  // Sales Funnel Data
  const funnelData = useMemo(() => {
    return DEFAULT_STAGES.map(stage => ({
      name: stage,
      value: data.filter(d => d.stage === stage).length,
      amount: data.filter(d => d.stage === stage).reduce((acc, curr) => acc + curr.amount, 0)
    }));
  }, [data]);

  // ROI / ROAS Statistics
  const roiStats = useMemo(() => {
    const revenue = data.filter(d => d.stage === 'Concluído').reduce((acc, curr) => acc + curr.amount, 0);
    const spend = adSpend;
    const profit = revenue - spend;
    const roas = spend > 0 ? (revenue / spend) : 0;
    const roiPercent = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

    return {
      revenue,
      spend,
      profit,
      roas: roas.toFixed(2),
      roiPercent: roiPercent.toFixed(1),
      chartData: [
        { name: 'Investimento', value: spend, fill: '#f1f5f9' },
        { name: 'Faturamento', value: revenue, fill: '#6d47df' }
      ]
    };
  }, [data, adSpend]);

  // Taxa de Conversão para Saúde da Carteira
  const conversionStats = useMemo(() => {
    const total = data.length;
    const won = data.filter(d => d.stage === 'Concluído').length;
    const others = total - won;
    const rate = total > 0 ? (won / total) * 100 : 0;

    return {
      rate: rate.toFixed(1),
      total,
      won,
      others,
      chartData: [
        { name: 'Concluído', value: won },
        { name: 'Em Andamento', value: others }
      ]
    };
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
    })).slice(-15);
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Funnel Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Funil Comercial</h3>
              <p className="text-sm text-slate-500">Fluxo atual por estágio</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#6d47df]">{formatCurrency(data.reduce((a, c) => a + c.amount, 0))}</span>
              <p className="text-xs text-slate-400 font-medium">Volume em Pipeline</p>
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
                  width={120} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
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
        </div>

        {/* Saúde da Carteira: Taxa de Conversão */}
        <div className="glass p-8 rounded-[32px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Saúde da Carteira</h3>
          <p className="text-sm text-slate-500 mb-6">Taxa de conversão</p>
          
          <div className="h-[250px] w-full relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-4xl font-black text-[#6d47df] tracking-tighter">{conversionStats.rate}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversão</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversionStats.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill="#6d47df" strokeWidth={0} />
                  <Cell fill="#f1f5f9" strokeWidth={0} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-auto">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#6d47df]"></div>
                  <span className="text-slate-600 font-bold">Concluído</span>
                </div>
                <span className="font-black text-slate-900">{conversionStats.won}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span className="text-slate-400 font-bold">Em Aberto / Outros</span>
                </div>
                <span className="font-bold text-slate-400">{conversionStats.others}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE ROI COMPLETA - ESPAÇO CENTRAL SOLICITADO */}
      <div className="glass p-8 rounded-[40px] border-white/50 shadow-2xl overflow-hidden relative group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#6d47df]/5 rounded-full blur-3xl transition-all group-hover:bg-[#6d47df]/10"></div>
        
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Esquerda: Métricas e Gráfico ROI */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#6d47df] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6d47df]/20">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Performance Financeira & ROI</h3>
                <p className="text-sm text-slate-500 font-medium">Análise de retorno sobre investimento em anúncios</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/40 p-5 rounded-2xl border border-white/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Gasto</p>
                <p className="text-lg font-black text-slate-900">{formatCurrency(roiStats.spend)}</p>
              </div>
              <div className="bg-[#6d47df]/5 p-5 rounded-2xl border border-[#6d47df]/10">
                <p className="text-[10px] font-black text-[#6d47df] uppercase tracking-widest mb-1">Faturamento (Ganho)</p>
                <p className="text-lg font-black text-[#6d47df]">{formatCurrency(roiStats.revenue)}</p>
              </div>
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Lucro Bruto</p>
                <p className="text-lg font-black text-emerald-700">{formatCurrency(roiStats.profit)}</p>
              </div>
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">ROAS Global</p>
                <p className="text-lg font-black text-indigo-700">{roiStats.roas}x</p>
              </div>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiStats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                    {roiStats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Direita: Gauge ROI e Insights */}
          <div className="lg:w-[350px] flex flex-col justify-center items-center gap-6 border-l border-slate-200/50 pl-0 lg:pl-10">
            <div className="relative flex flex-col items-center">
              <div className="w-48 h-48 rounded-full border-[10px] border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-[#6d47df] transition-all duration-1000" style={{ height: `${Math.min(Number(roiStats.roiPercent) / 10, 100)}%`, opacity: 0.1 }}></div>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{roiStats.roiPercent}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ROI Líquido</span>
              </div>
              <div className="mt-4 flex flex-col items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${Number(roiStats.roiPercent) > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {Number(roiStats.roiPercent) > 0 ? <ArrowUpRight size={14} /> : <Activity size={14} />}
                  {Number(roiStats.roiPercent) > 0 ? 'Positivo' : 'Calculando'}
                </div>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                    <Target size={18} />
                  </div>
                  <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Custo por Aquisição (CPA)</span>
                </div>
                <p className="text-xl font-black text-slate-900">
                  {data.filter(d => d.stage === 'Concluído').length > 0 
                    ? formatCurrency(adSpend / data.filter(d => d.stage === 'Concluído').length)
                    : 'R$ 0,00'}
                </p>
              </div>
              
              <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest">
                Dados atualizados com base no investimento configurado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="glass p-8 rounded-[32px]">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-lg font-bold text-slate-900">Histórico de Movimentação</h3>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-[#6d47df]"></div>
                 <span className="text-xs font-semibold text-slate-500">Valor Captado</span>
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
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Receita" stroke="#6d47df" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
