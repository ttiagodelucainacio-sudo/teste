
import React, { useState } from 'react';
import { 
  Phone, MessageSquare, Mail, MoreHorizontal, 
  Trash2, Edit3, TrendingUp, DollarSign,
  AlertCircle, CheckCircle2, Star, Info, Clock
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
          className={`bg-white rounded-[20px] p-3.5 mb-3 border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative ring-1 ring-slate-50/50 ${snapshot.isDragging ? 'dragging shadow-2xl ring-2 ring-[#6d47df]/20 z-[200]' : 'z-10'}`}
        >
          {/* Header Compacto */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 overflow-hidden">
               <h4 className="text-[12px] font-black text-slate-900 leading-tight tracking-tight truncate">{lead.owner}</h4>
               <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-tighter">{lead.commercialName}</p>
            </div>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${showActions ? 'bg-[#6d47df] text-white' : 'hover:bg-slate-50 text-slate-300'}`}
              >
                <MoreHorizontal size={14} />
              </button>
              
              {showActions && (
                <>
                  <div className="fixed inset-0 z-[210]" onClick={() => setShowActions(false)}></div>
                  <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-[220] py-1.5 ring-1 ring-slate-200 animate-in overflow-hidden">
                    <button onClick={() => { onEdit(lead); setShowActions(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 transition-colors">
                      <Edit3 size={12} className="text-[#6d47df]" /> Editar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('Excluir este registro?')) { onDelete(lead.id); setShowActions(false); } }} 
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-3">
             <span className="text-[14px] font-black text-[#6d47df] tracking-tighter">{formatCurrency(lead.amount)}</span>
             <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase tracking-tighter ${getScoreColor(lead.score)}`}>
                <Star size={8} fill="currentColor" /> {lead.score}%
             </div>
          </div>

          {/* Campo de Observação Visível no Card */}
          {lead.observations ? (
            <div className="bg-blue-50/40 rounded-lg p-2.5 mb-3 border border-blue-100/20">
               <div className="flex items-center gap-1.5 mb-1 opacity-70">
                  <Info size={9} className="text-blue-500" />
                  <span className="text-[7px] font-black text-blue-500 uppercase tracking-[1px]">Observação</span>
               </div>
               <p className="text-[9px] font-bold text-slate-600 line-clamp-2 leading-snug italic">"{lead.observations}"</p>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-lg p-2.5 mb-3 border border-slate-100/30">
               <div className="flex items-center gap-1.5 mb-1 opacity-40">
                  <Clock size={9} className="text-slate-400" />
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-[1px]">Status</span>
               </div>
               <p className="text-[9px] font-bold text-slate-400 line-clamp-1 truncate italic">"{lead.activities[0]?.description || 'Sem histórico'}"</p>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
            <div className="flex gap-2.5">
               <Phone size={13} className="text-slate-200 hover:text-[#6d47df] cursor-pointer transition-colors" />
               <MessageSquare size={13} className="text-slate-200 hover:text-[#6d47df] cursor-pointer transition-colors" />
               <Mail size={13} className="text-slate-200 hover:text-[#6d47df] cursor-pointer transition-colors" />
            </div>
            {lead.stage === 'Concluído' && (
              <div className="bg-emerald-500 text-white p-0.5 rounded-md shadow-sm">
                <CheckCircle2 size={10} />
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
      <div className="overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar custom-scroll-area">
        <div className="flex gap-4 items-start min-w-max">
          {columns.map(column => {
            const leadsInColumn = data.filter(d => d.stage === column);
            const columnValue = leadsInColumn.reduce((acc, curr) => acc + curr.amount, 0);
            const isFinished = column === 'Concluído';
            
            return (
              <div key={column} className="flex-shrink-0 w-[240px]">
                <div className="flex flex-col mb-3 px-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                       <h3 className={`text-[9px] font-black uppercase tracking-[1.5px] ${isFinished ? 'text-emerald-500' : 'text-slate-900'}`}>{column}</h3>
                       <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${isFinished ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                         {leadsInColumn.length}
                       </span>
                    </div>
                    <div className="h-[1px] w-full bg-slate-200/50 mb-1"></div>
                    <p className="text-[9px] text-slate-400 font-bold tracking-tight">{formatCurrency(columnValue)}</p>
                </div>
                
                <Droppable droppableId={column}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`rounded-[24px] p-2 border transition-all duration-300 min-h-[550px] ${snapshot.isDraggingOver ? 'bg-[#6d47df]/5 border-[#6d47df]/10' : 'bg-slate-100/10 border-slate-200/10'}`}
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
                        <div className="h-32 flex flex-col items-center justify-center text-slate-200 border-2 border-dashed border-slate-200/20 rounded-[20px] m-1">
                            <TrendingUp size={20} className="mb-2 opacity-5" />
                            <span className="text-[7px] font-black uppercase tracking-[1px] opacity-10">Mover para cá</span>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
