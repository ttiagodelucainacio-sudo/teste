
import React from 'react';
import { MoreHorizontal, User, ExternalLink } from 'lucide-react';
import { SaleRecord } from '../types';
import { formatCurrency } from '../utils/dataGenerator';

interface TableProps {
  data: SaleRecord[];
}

const StatusBadge: React.FC<{ status: SaleRecord['status'] }> = ({ status }) => {
  const styles = {
    Won: 'bg-emerald-100 text-emerald-600',
    Lost: 'bg-rose-100 text-rose-600',
    Open: 'bg-amber-100 text-amber-600',
  };

  const labels = {
    Won: 'Ganho',
    Lost: 'Perdido',
    Open: 'Em Aberto'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const DataTable: React.FC<TableProps> = ({ data }) => {
  return (
    <div className="glass overflow-hidden rounded-[32px] border-white/40 mb-10">
      <div className="p-8 border-b border-white/20 flex items-center justify-between bg-white/30">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Negócios Recentes</h3>
          <p className="text-sm text-slate-500 font-medium">Logs detalhados de interações comerciais</p>
        </div>
        <button className="flex items-center gap-2 text-[#6d47df] text-sm font-black hover:underline tracking-tight">
          Ver todos <ExternalLink size={14} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Empresa / Cliente</th>
              <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Valor</th>
              <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Etapa</th>
              <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Status</th>
              <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Data</th>
              <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[2px]"></th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 8).map((deal) => (
              <tr key={deal.id} className="group hover:bg-white/40 transition-colors border-b border-slate-50 last:border-0">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#6d47df] group-hover:text-white transition-all shadow-sm">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{deal.commercialName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Resp: {deal.owner}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="text-sm font-black text-[#6d47df]">{formatCurrency(deal.amount)}</p>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs font-black text-slate-500 uppercase">{deal.stage}</p>
                </td>
                <td className="px-8 py-5">
                  <StatusBadge status={deal.status} />
                </td>
                <td className="px-8 py-5">
                  <p className="text-sm text-slate-500 font-bold">{new Date(deal.date).toLocaleDateString('pt-BR')}</p>
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-slate-600 transition-all">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
