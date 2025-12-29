
import React, { useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SaleRecord } from '../types';
import { formatCurrency, formatPercent } from '../utils/dataGenerator';

interface KPIProps {
  data: SaleRecord[];
}

const KPICard: React.FC<{ 
  title: string, 
  value: string | number, 
  variation: number, 
  icon: React.ReactNode,
  color: string 
}> = ({ title, value, variation, icon, color }) => {
  const isPositive = variation >= 0;
  
  return (
    <div className="glass p-6 rounded-[24px] flex flex-col gap-4 group hover:bg-white/50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 text-opacity-100 shadow-sm transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(variation).toFixed(1)}%
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
      </div>
    </div>
  );
};

const KPISection: React.FC<KPIProps> = ({ data }) => {
  const stats = useMemo(() => {
    const totalRevenue = data.reduce((acc, curr) => acc + (curr.status === 'Won' ? curr.amount : 0), 0);
    const totalSales = data.filter(d => d.status === 'Won').length;
    const newClients = data.length;
    const conversionRate = (totalSales / Math.max(newClients, 1)) * 100;

    return {
      totalRevenue,
      totalSales,
      newClients,
      conversionRate
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KPICard 
        title="Total de Vendas" 
        value={stats.totalSales} 
        variation={12.5} 
        icon={<Target className="text-indigo-600" size={24} />} 
        color="bg-indigo-600"
      />
      <KPICard 
        title="Novas Oportunidades" 
        value={stats.newClients} 
        variation={8.2} 
        icon={<Users className="text-blue-600" size={24} />} 
        color="bg-blue-600"
      />
      <KPICard 
        title="Taxa de Conversão" 
        value={formatPercent(stats.conversionRate)} 
        variation={-2.4} 
        icon={<TrendingUp className="text-[#6d47df]" size={24} />} 
        color="bg-[#6d47df]"
      />
      <KPICard 
        title="Faturamento" 
        value={formatCurrency(stats.totalRevenue)} 
        variation={15.8} 
        icon={<DollarSign className="text-emerald-600" size={24} />} 
        color="bg-emerald-600"
      />
    </div>
  );
};

export default KPISection;
