
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Plus, User, LayoutGrid, X, Check, 
  Trash2, Edit3, Settings2, BarChart3, UploadCloud, ChevronDown,
  CalendarCheck, PieChart, Sparkles, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SaleRecord, TimePeriod, ViewMode, Pipeline, Task, Activity } from './types';
import { generateMockData, generateInitialPipelines, DEFAULT_STAGES } from './utils/dataGenerator';
import KPISection from './components/KPISection';
import ChartsSection from './components/ChartsSection';
import DataTable from './components/DataTable';
import KanbanBoard from './components/KanbanBoard';

const App: React.FC = () => {
  const [data, setData] = useState<SaleRecord[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<SaleRecord | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Inicialização e Persistência em LocalStorage
  useEffect(() => {
    const savedPipelines = localStorage.getItem('elevate_v4_pipelines');
    const savedData = localStorage.getItem('elevate_v4_data');
    
    let loadedPipelines: Pipeline[];
    if (savedPipelines) {
      loadedPipelines = JSON.parse(savedPipelines);
      setPipelines(loadedPipelines);
    } else {
      loadedPipelines = generateInitialPipelines();
      setPipelines(loadedPipelines);
      localStorage.setItem('elevate_v4_pipelines', JSON.stringify(loadedPipelines));
    }

    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      const initialData = generateMockData(loadedPipelines);
      setData(initialData);
      localStorage.setItem('elevate_v4_data', JSON.stringify(initialData));
    }
    
    if (loadedPipelines.length > 0) setSelectedPipelineId(loadedPipelines[0].id);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('elevate_v4_data', JSON.stringify(data));
      localStorage.setItem('elevate_v4_pipelines', JSON.stringify(pipelines));
    }
  }, [data, pipelines, isLoaded]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Logica de Negócio: Leads
  const handleAddOrEditLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const stage = formData.get('stage') as string;
    
    const newLead: SaleRecord = {
      id: editingLead ? editingLead.id : `lead-${Date.now()}`,
      owner: (formData.get('owner') as string) || 'Admin',
      commercialName: (formData.get('commercialName') as string) || 'Novo Cliente',
      amount: Number(formData.get('amount')) || 0,
      stage: stage,
      source: (formData.get('source') as any) || 'Direct',
      pipelineId: selectedPipelineId,
      status: (stage === 'Fechado' || stage === 'Pago') ? 'Won' : 'Open',
      date: editingLead ? editingLead.date : new Date().toISOString().split('T')[0],
      activities: editingLead ? editingLead.activities : [{
        id: `act-${Date.now()}`,
        type: 'Automation',
        description: 'Lead criado manualmente.',
        date: new Date().toISOString(),
        owner: 'System'
      }],
      tasks: editingLead ? editingLead.tasks : [],
      tags: editingLead ? editingLead.tags : [],
      score: editingLead ? editingLead.score : 50
    };

    setData(prev => {
      if (editingLead) return prev.map(l => l.id === editingLead.id ? newLead : l);
      return [newLead, ...prev];
    });

    showToast(editingLead ? 'Registro Atualizado!' : 'Oportunidade Criada!');
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleDeleteLead = (id: string | number) => {
    setData(prev => prev.filter(l => String(l.id) !== String(id)));
    showToast('Lead removido com sucesso!', 'error');
  };

  const handleMoveLead = (id: string | number, newStage: string) => {
    setData(prev => prev.map(l => {
      if (String(l.id) === String(id)) {
        const newStatus = (newStage === 'Fechado' || newStage === 'Pago') ? 'Won' : l.status;
        const newActivity: Activity = {
          id: `move-${Date.now()}`,
          type: 'Automation',
          description: `Movido de "${l.stage}" para "${newStage}"`,
          date: new Date().toISOString(),
          owner: 'System'
        };
        return { ...l, stage: newStage, status: newStatus as any, activities: [newActivity, ...l.activities] };
      }
      return l;
    }));
  };

  // Logica de Negócio: Pipelines
  const handleCreatePipeline = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('pipelineName') as string;
    if (!name) return;
    const newP = { id: `p-${Date.now()}`, name };
    setPipelines(prev => [...prev, newP]);
    setSelectedPipelineId(newP.id);
    setViewMode('leads');
    showToast(`Funil "${name}" configurado.`);
    setIsPipelineModalOpen(false);
  };

  const handleDeletePipeline = (id: string) => {
    if (pipelines.length <= 1) return showToast('Mínimo de 1 funil obrigatório.', 'error');
    if (confirm('Atenção: Todos os dados deste pipeline serão excluídos permanentemente. Continuar?')) {
      const rest = pipelines.filter(p => p.id !== id);
      setPipelines(rest);
      setData(prev => prev.filter(l => l.pipelineId !== id));
      setSelectedPipelineId(rest[0].id);
      showToast('Funil removido.', 'error');
    }
  };

  // Insights do Dashboard (IA Mock)
  const dashboardInsights = useMemo(() => {
    const totalLeads = data.filter(d => d.pipelineId === selectedPipelineId).length;
    const stagnantLeads = data.filter(d => d.pipelineId === selectedPipelineId && d.activities.length === 1).length;
    return {
      title: "Resumo de Performance",
      tip: stagnantLeads > 5 ? "Você tem muitos leads sem follow-up." : "Fluxo de leads saudável.",
      stagnant: stagnantLeads
    };
  }, [data, selectedPipelineId]);

  const filteredData = useMemo(() => data.filter(d => d.pipelineId === selectedPipelineId), [data, selectedPipelineId]);

  return (
    <div className="flex min-h-screen bg-[#f1f4f9] text-slate-800 selection:bg-[#6d47df]/20">
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in ${toast.type === 'success' ? 'bg-[#6d47df] text-white' : 'bg-rose-500 text-white'}`}>
          {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Glass MacOS */}
      <aside className={`fixed left-0 top-0 h-full ${isSidebarOpen ? 'w-72' : 'w-24'} transition-all duration-500 z-50 sidebar-glass flex flex-col p-6`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-[#6d47df] rounded-[18px] flex items-center justify-center shadow-xl shadow-[#6d47df]/30 ring-4 ring-white/20">
            <Sparkles className="text-white" size={24} />
          </div>
          {isSidebarOpen && <h1 className="text-2xl font-black tracking-tighter text-[#6d47df] italic">ELEVATE</h1>}
        </div>

        <nav className="flex-1 space-y-3">
          <NavItem icon={<BarChart3 size={22} />} label="Performance" active={viewMode === 'dashboard'} onClick={() => setViewMode('dashboard')} isOpen={isSidebarOpen} />
          <NavItem icon={<LayoutGrid size={22} />} label="Funis de Venda" active={viewMode === 'leads'} onClick={() => setViewMode('leads')} isOpen={isSidebarOpen} />
          
          <div className={`pt-10 pb-4 px-4 ${!isSidebarOpen && 'hidden'}`}>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2.5px]">Meus Pipelines</span>
          </div>

          {pipelines.map(p => (
            <div 
              key={p.id}
              onClick={() => { setSelectedPipelineId(p.id); setViewMode('leads'); }}
              className={`group flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-2xl transition-all ${selectedPipelineId === p.id && viewMode === 'leads' ? 'bg-[#6d47df] text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <LayoutGrid size={18} />
              {isSidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-bold truncate">{p.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeletePipeline(p.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/20 rounded-lg transition-all"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}

          <button onClick={() => setIsPipelineModalOpen(true)} className="w-full flex items-center gap-4 px-4 py-3.5 text-[#6d47df] bg-[#6d47df]/5 hover:bg-[#6d47df]/10 rounded-2xl transition-all mt-4">
            <Plus size={20} />
            {isSidebarOpen && <span className="text-sm font-black">Criar Pipeline</span>}
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-200/50 space-y-4">
          <NavItem icon={<Settings2 size={22} />} label="Ajustes" isOpen={isSidebarOpen} />
          <div className="flex items-center gap-4 px-4 py-4 glass rounded-3xl hover:bg-white/60 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-[#6d47df]/10 flex items-center justify-center text-[#6d47df] font-black shadow-inner">AD</div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden leading-tight">
                <p className="text-xs font-black text-slate-800">Admin Elevate</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Master User</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 ${isSidebarOpen ? 'ml-72' : 'ml-24'} transition-all duration-500 p-12 bg-transparent`}>
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Sistema Operante</div>
               <p className="text-xs font-bold text-slate-400">Elevate / CRM / {viewMode.toUpperCase()}</p>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
              {pipelines.find(p => p.id === selectedPipelineId)?.name || 'Pipeline'}
              <span className="ml-4 text-sm font-bold text-slate-300">v4.2.0</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
             <div className="flex items-center glass rounded-2xl p-1.5 shadow-sm bg-white/30">
                <button className={`p-3 rounded-xl transition-all ${viewMode === 'leads' ? 'bg-[#6d47df] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} onClick={() => setViewMode('leads')}><LayoutGrid size={22} /></button>
                <button className={`p-3 rounded-xl transition-all ${viewMode === 'dashboard' ? 'bg-[#6d47df] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} onClick={() => setViewMode('dashboard')}><BarChart3 size={22} /></button>
             </div>

             <div className="flex gap-3">
               <label className="flex items-center gap-3 px-6 py-4 glass border-white/60 text-slate-800 rounded-3xl hover:bg-white/60 transition-all cursor-pointer font-black text-xs shadow-xl shadow-slate-200/50">
                 <UploadCloud size={20} className="text-[#6d47df]" /> Google Ads
                 <input type="file" className="hidden" accept=".xlsx" onChange={() => showToast("Google Ads Import iniciado.")} />
               </label>

               <button onClick={() => { setEditingLead(null); setIsModalOpen(true); }} className="flex items-center gap-3 px-8 py-4 bg-[#6d47df] text-white rounded-[24px] hover:bg-[#5a36c5] transition-all shadow-2xl shadow-[#6d47df]/40 font-black text-xs uppercase tracking-wider">
                 <Plus size={22} /> Novo Negócio
               </button>
             </div>
          </div>
        </header>

        {/* Dashboard com Insights de IA */}
        {viewMode === 'dashboard' && (
          <div className="mb-10 p-8 glass rounded-[40px] border-[#6d47df]/10 flex items-center justify-between gap-8 animate-in bg-gradient-to-br from-[#6d47df]/5 to-transparent">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#6d47df] rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-[#6d47df]/20">
                   <Sparkles size={32} />
                </div>
                <div>
                   <h4 className="text-xl font-black text-slate-900 leading-tight">Insight Profissional</h4>
                   <p className="text-slate-500 font-bold text-sm">{dashboardInsights.tip}</p>
                </div>
             </div>
             <div className="hidden lg:flex gap-8">
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads Frios</p>
                   <p className="text-2xl font-black text-rose-500">{dashboardInsights.stagnant}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ciclo Médio</p>
                   <p className="text-2xl font-black text-[#6d47df]">12 Dias</p>
                </div>
             </div>
          </div>
        )}

        <div className="animate-in pb-20">
          {viewMode === 'dashboard' ? (
            <>
              <KPISection data={filteredData} />
              <ChartsSection data={filteredData} />
              <div className="mt-16">
                <DataTable data={filteredData} />
              </div>
            </>
          ) : viewMode === 'leads' ? (
            <KanbanBoard 
              data={filteredData} 
              onMove={handleMoveLead} 
              onEdit={(lead) => { setEditingLead(lead); setIsModalOpen(true); }}
              onDelete={handleDeleteLead}
            />
          ) : (
             <div className="glass p-24 rounded-[48px] text-center max-w-3xl mx-auto shadow-inner bg-white/20">
                <div className="w-24 h-24 bg-[#6d47df]/10 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                   <Settings2 size={48} className="text-[#6d47df] opacity-40" />
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tighter">Administração & Regras</h3>
                <p className="text-slate-500 font-bold mb-10 leading-relaxed">Defina metas para os vendedores, configure taxas de impostos e gerencie integrações API oficiais.</p>
                <button onClick={() => setViewMode('leads')} className="px-12 py-5 bg-[#6d47df] text-white rounded-[24px] font-black shadow-2xl hover:scale-105 transition-all">Configurar Automações</button>
             </div>
          )}
        </div>
      </main>

      {/* Modal Lead - Estilo MacOS Detail */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-8">
          <div className="glass w-full max-w-2xl rounded-[48px] p-12 shadow-3xl border-white/60 animate-in relative overflow-hidden bg-white/90">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6d47df] to-[#a5b4fc]"></div>
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"><X size={28} /></button>
            
            <div className="mb-10">
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                 <Edit3 className="text-[#6d47df]" /> {editingLead ? 'Detalhes do Negócio' : 'Criar Nova Oportunidade'}
               </h3>
               <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Informações de Pipeline Corporativo</p>
            </div>
            
            <form onSubmit={handleAddOrEditLead} className="space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dono do Negócio</label>
                  <input name="owner" defaultValue={editingLead?.owner || ''} required className="w-full px-6 py-4 bg-white/60 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-[#6d47df]/10 transition-all font-black text-sm" placeholder="Selecione o Consultor" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Budget / Valor</label>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</span>
                     <input name="amount" type="number" defaultValue={editingLead?.amount || ''} required className="w-full pl-12 pr-6 py-4 bg-white/60 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-[#6d47df]/10 font-black text-sm" placeholder="0.00" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Fantasia / Empresa</label>
                <input name="commercialName" defaultValue={editingLead?.commercialName || ''} required className="w-full px-6 py-4 bg-white/60 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-[#6d47df]/10 font-black text-sm" placeholder="Ex: Corporação Global LTDA" />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Etapa Atual do Pipeline</label>
                  <select name="stage" defaultValue={editingLead?.stage || DEFAULT_STAGES[0]} className="w-full px-6 py-4 bg-white/60 border border-slate-200 rounded-[20px] font-black text-sm appearance-none cursor-pointer">
                    {DEFAULT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Origem do Lead</label>
                  <select name="source" defaultValue={editingLead?.source || 'Direct'} className="w-full px-6 py-4 bg-white/60 border border-slate-200 rounded-[20px] font-black text-sm appearance-none cursor-pointer">
                    <option value="Meta Ads">Meta Business Ads</option>
                    <option value="Google">Google Search Console</option>
                    <option value="Direct">Direto / Reativação</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 flex gap-5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-5 rounded-[24px] font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]">Descartar</button>
                <button type="submit" className="flex-2 px-12 py-5 bg-[#6d47df] text-white rounded-[24px] font-black hover:bg-[#5a36c5] transition-all shadow-2xl shadow-[#6d47df]/30 uppercase tracking-widest text-[10px]">Commit de Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Pipeline */}
      {isPipelineModalOpen && (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-6">
          <div className="glass w-full max-w-sm rounded-[40px] p-10 shadow-3xl animate-in bg-white">
            <h3 className="text-2xl font-black mb-8 tracking-tighter">Novo Fluxo de Venda</h3>
            <form onSubmit={handleCreatePipeline} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação do Funil</label>
                <input name="pipelineName" required autoFocus className="w-full px-6 py-4 bg-white border border-slate-200 rounded-[20px] outline-none font-black text-sm" placeholder="Vendas Enterprise" />
              </div>
              <div className="pt-4 flex flex-col gap-4">
                <button type="submit" className="w-full py-5 bg-[#6d47df] text-white rounded-[24px] font-black shadow-xl shadow-[#6d47df]/20">Registrar Pipeline</button>
                <button type="button" onClick={() => setIsPipelineModalOpen(false)} className="w-full py-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, isOpen: boolean }> = ({ icon, label, active, onClick, isOpen }) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-4 cursor-pointer rounded-2xl transition-all duration-300 ${active ? 'bg-[#6d47df] text-white shadow-xl shadow-[#6d47df]/40 scale-105' : 'text-slate-500 hover:bg-white/50'}`}>
    {icon}
    {isOpen && <span className="text-sm font-black tracking-tight">{label}</span>}
  </div>
);

export default App;
