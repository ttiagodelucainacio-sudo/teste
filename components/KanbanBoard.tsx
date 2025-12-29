
import React, { useState } from 'react';
import { 
  Phone, MessageSquare, Mail, MoreHorizontal, 
  Trash2, Edit3, TrendingUp, DollarSign,
  AlertCircle, CheckCircle2, Star
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { SaleRecord } from '../types';
import { DEFAULT_STAGES, formatCurrency } from '../utils/dataGenerator';

interface KanbanProps {
  data: SaleRecord[];
  onMove: (id: string | number, stage: string) => void;
  onEdit: (lead: SaleRecord) => void;
  onDelete: (id: string | number) => void;
}

const KanbanCard: React.FC<{ 
  lead: SaleRecord, 
  index: number,
  onEdit: KanbanProps['onEdit'],
  onDelete: KanbanProps['onDelete']
}> = ({ lead, index, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  const getScoreColor = (score: number) => {
    if (score > 70) return 'text-emerald-500 bg-emerald-50';
    if (score > 40) return 'text-amber-500 bg-amber-50';
    return 'text-rose-500 bg-rose-50';
  };

  return (
    <Draggable draggableId={String(lead.id)} index={index}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-[32px] p-6 mb-6 border border-slate-100 shadow-sm hover:shadow-3xl transition-all group relative ring-1 ring-slate-50 ${snapshot.isDragging ? 'dragging shadow-4xl ring-8 ring-[#6d47df]/10 rotate-2 z-[200]' : 'z-10'}`}
        >
          {/* Header do Card */}
          <div className="flex justify-between items-start mb-5">
            <div>
               <h4 className="text-sm font-black text-slate-900 leading-tight tracking-tight">{lead.owner}</h4>
               <p className="text-[10px] font-bold text-slate-400 mt-0.5">{lead.commercialName}</p>
            </div>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${showActions ? 'bg-[#6d47df] text-white' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <MoreHorizontal size={20} />
              </button>
              
              {showActions && (
                <>
                  <div className="fixed inset-0 z-[210]" onClick={() => setShowActions(false)}></div>
                  <div className="absolute right-0 top-12 w-60 bg-white rounded-3xl shadow-4xl border border-slate-100 z-[220] py-4 ring-1 ring-slate-200 animate-in overflow-hidden">
                    <button onClick={() => { onEdit(lead); setShowActions(false); }} className="w-full flex items-center gap-4 px-6 py-4 text-xs font-black text-slate-700 hover:bg-slate-50 transition-colors">
                      <Edit3 size={18} className="text-[#6d47df]" /> Editar Negócio
                    </button>
                    <div className="h-px bg-slate-100 mx-4 my-1"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('Excluir este lead permanentemente?')) { onDelete(lead.id); setShowActions(false); } }} 
                      className="w-full flex items-center gap-4 px-6 py-4 text-xs font-black text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={18} /> Excluir do Pipeline
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Valor e Score */}
          <div className="flex items-center justify-between mb-6">
             <span className="text-lg font-black text-[#6d47df]">{formatCurrency(lead.amount)}</span>
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter ${getScoreColor(lead.score)}`}>
                <Star size={12} fill="currentColor" /> {lead.score}% Score
             </div>
          </div>

          {/* Atividades Recentes */}
          <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-100/50">
             <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={10} className="text-amber-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Última Ação</span>
             </div>
             <p className="text-[10px] font-bold text-slate-600 line-clamp-1 italic">"{lead.activities[0]?.description || 'Sem histórico'}"</p>
          </div>

          {/* Footer do Card com Contatos Rápidos */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-50">
            <div className="flex gap-4">
               <Phone size={18} className="text-slate-300 hover:text-[#6d47df] cursor-pointer transition-colors" />
               <MessageSquare size={18} className="text-slate-300 hover:text-[#6d47df] cursor-pointer transition-colors" />
               <Mail size={18} className="text-slate-300 hover:text-[#6d47df] cursor-pointer transition-colors" />
            </div>
            {lead.status === 'Won' && (
              <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20" title="Venda Ganha">
                <CheckCircle2 size={16} />
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const KanbanBoard: React.FC<KanbanProps> = ({ data, onMove, onEdit, onDelete }) => {
  const columns = DEFAULT_STAGES;

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    if (destination.droppableId === result.source.droppableId) return;
    onMove(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-10 overflow-x-auto pb-20 items-start -mx-12 px-12" style={{ width: 'calc(100% + 100px)' }}>
        {columns.map(column => {
          const leadsInColumn = data.filter(d => d.stage === column);
          const columnValue = leadsInColumn.reduce((acc, curr) => acc + curr.amount, 0);
          const isSuccess = column === 'Pago' || column === 'Fechado';
          
          return (
            <div key={column} className="flex-shrink-0 w-[360px]">
              <div className="flex flex-col mb-8 px-6">
                  <div className="flex items-center justify-between">
                     <h3 className={`text-[13px] font-black uppercase tracking-[4px] ${isSuccess ? 'text-emerald-500' : 'text-slate-900'}`}>{column}</h3>
                     <span className={`text-[10px] px-3 py-1 rounded-full font-black ${isSuccess ? 'bg-emerald-500 text-white' : 'bg-[#6d47df] text-white shadow-lg'}`}>
                       {leadsInColumn.length}
                     </span>
                  </div>
                  <p className="text-[12px] text-slate-400 font-black mt-2 tracking-tighter">Budget Total: {formatCurrency(columnValue)}</p>
              </div>
              
              <Droppable droppableId={column}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`kanban-column rounded-[48px] p-4 border transition-all duration-500 min-h-[700px] ${snapshot.isDraggingOver ? 'bg-[#6d47df]/5 shadow-inner border-[#6d47df]/20 scale-[1.01]' : 'bg-slate-100/20 border-slate-200/40'}`}
                  >
                    {leadsInColumn.map((lead, index) => (
                      <KanbanCard 
                        key={lead.id} 
                        lead={lead} 
                        index={index}
                        onEdit={onEdit} 
                        onDelete={onDelete} 
                      />
                    ))}
                    {provided.placeholder}
                    {leadsInColumn.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-80 flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-200/50 rounded-[40px] m-4 animate-pulse">
                          <TrendingUp size={48} className="mb-6 opacity-10" />
                          <span className="text-[11px] font-black uppercase tracking-[3px] opacity-20 text-center px-10">Mover Oportunidade Aqui</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
