
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Plus, User, LayoutGrid, X, Check, 
  Trash2, Edit3, Settings2, BarChart3, UploadCloud, ChevronDown,
  Sparkles, AlertCircle, Wallet, Moon, Sun, Monitor, Type
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SaleRecord, ViewMode, Pipeline, Activity } from './types';
import { generateMockData, generateInitialPipelines, DEFAULT_STAGES } from './utils/dataGenerator';
import KPISection from './components/KPISection';
import ChartsSection from './components/ChartsSection';
import DataTable from './components/DataTable';
import KanbanBoard from './components/KanbanBoard';

const App: React.FC = () => {
  const [data, setData] = useState<SaleRecord[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('leads');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [adSpend, setAdSpend] = useState<number>(() => {
    const saved = localStorage.getItem('elevate_ad_spend');
    return saved ? Number(saved) : 0;
  });

  // Settings states
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('elevate_theme') as any) || 'light';
  });
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('elevate_font_size') as any) || 'medium';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<SaleRecord | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPipelines = localStorage.getItem('elevate_v5_pipelines');
    const savedData = localStorage.getItem('elevate_v5_data');
    
    let loadedPipelines: Pipeline[];
    if (savedPipelines) {
      loadedPipelines = JSON.parse(savedPipelines);
      setPipelines(loadedPipelines);
    } else {
      loadedPipelines = generateInitialPipelines();
      setPipelines(loadedPipelines);
      localStorage.setItem('elevate_v5_pipelines', JSON.stringify(loadedPipelines));
    }

    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      setData([]);
    }
    
    if (loadedPipelines.length > 0) setSelectedPipelineId(loadedPipelines[0].id);
    setIsLoaded(true);
  }, []);

  // Sync settings with DOM and LocalStorage
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('elevate_theme', theme);
  }, [theme]);

  useEffect(() => {
    const sizes = { small: '90%', medium: '100%', large: '110%' };
    document.documentElement.style.setProperty('--base-font-size', sizes[fontSize]);
    localStorage.setItem('elevate_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('elevate_v5_data', JSON.stringify(data));
      localStorage.setItem('elevate_v5_pipelines', JSON.stringify(pipelines));
      localStorage.setItem('elevate_ad_spend', adSpend.toString());
    }
  }, [data, pipelines, adSpend, isLoaded]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddOrEditLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const stage = formData.get('stage') as string;
    const observations = formData.get('observations') as string;
    
    const newLead: SaleRecord = {
      id: editingLead ? editingLead.id : `lead-${Date.now()}`,
      owner: (formData.get('owner') as string) || 'Admin',
      commercialName: (formData.get('commercialName') as string) || 'Novo Lead',
      amount: Number(formData.get('amount')) || 0,
      stage: stage,
      source: (formData.get('source') as any) || 'Direct',
      observations: observations,
      pipelineId: selectedPipelineId,
      status: stage === 'Concluído' ? 'Won' : 'Open',
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

    showToast(editingLead ? 'Alterações salvas!' : 'Novo lead cadastrado!');
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleDeleteLead = (id: string | number) => {
    setData(prev => prev.filter(l => String(l.id) !== String(id)));
    showToast('Registro excluído.', 'error');
  };

  const handleMoveLead = (id: string | number, newStage: string) => {
    setData(prev => prev.map(l => {
      if (String(l.id) === String(id)) {
        const newStatus = newStage === 'Concluído' ? 'Won' : l.status;
        const newActivity: Activity = {
          id: `move-${Date.now()}`,
          type: 'Automation',
          description: `Movido para "${newStage}"`,
          date: new Date().toISOString(),
          owner: 'System'
        };
        return { ...l, stage: newStage, status: newStatus as any, activities: [newActivity, ...l.activities] };
      }
      return l;
    }));
  };

  const handleCreatePipeline = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('pipelineName') as string;
    if (!name) return;
    const newP = { id: `p-${Date.now()}`, name };
    setPipelines(prev => [...prev, newP]);
    setSelectedPipelineId(newP.id);
    setViewMode('leads');
    showToast(`Pipeline "${name}" criado.`);
    setIsPipelineModalOpen(false);
  };

  const handleGoogleAdsImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const importedLeads: SaleRecord[] = jsonData.map((row: any, index) => ({
          id: `import-${Date.now()}-${index}`,
          date: row.Data || new Date().toISOString().split('T')[0],
          amount: Number(row.Valor) || 0,
          status: row.Status === 'Ganho' ? 'Won' : (row.Status === 'Perdido' ? 'Lost' : 'Open'),
          stage: row.Etapa || DEFAULT_STAGES[0],
          owner: row.Responsável || 'Importado',
          pipelineId: selectedPipelineId,
          commercialName: row.Empresa || row.Lead || 'Lead Importado',
          source: (row.Origem as any) || 'Google',
          observations: row.Observações || '',
          activities: [{
            id: `act-import-${Date.now()}-${index}`,
            type: 'Automation',
            description: 'Lead importado via planilha.',
            date: new Date().toISOString(),
            owner: 'System'
          }],
          tasks: [],
          tags: [],
          score: Math.floor(Math.random() * 60) + 20
        }));

        setData(prev => [...importedLeads, ...prev]);
        showToast(`${importedLeads.length} leads importados!`);
      } catch (err) {
        showToast('Erro ao processar planilha.', 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredData = useMemo(() => data.filter(d => d.pipelineId === selectedPipelineId), [data, selectedPipelineId]);

  return (
    <div className="flex min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 z-[300] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in ${toast.type === 'success' ? 'bg-[#6d47df] text-white' : 'bg-rose-500 text-white'}`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span className="font-bold text-[11px] uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Otimizada */}
      <aside className={`fixed left-0 top-0 h-full ${isSidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 z-50 sidebar-glass flex flex-col p-4`}>
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-[#6d47df] rounded-[12px] flex items-center justify-center shadow-md">
            <Sparkles className="text-white" size={18} />
          </div>
          {isSidebarOpen && <h1 className="text-lg font-black tracking-tighter text-[#6d47df]">ELEVATE</h1>}
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
          <NavItem icon={<BarChart3 size={18} />} label="Performance" active={viewMode === 'dashboard'} onClick={() => setViewMode('dashboard')} isOpen={isSidebarOpen} />
          <NavItem icon={<LayoutGrid size={18} />} label="Funis" active={viewMode === 'leads'} onClick={() => setViewMode('leads')} isOpen={isSidebarOpen} />
          
          {isSidebarOpen && (
            <div className="pt-6 pb-2 px-3">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Pipelines</span>
            </div>
          )}

          {pipelines.map(p => (
            <div 
              key={p.id}
              onClick={() => { setSelectedPipelineId(p.id); setViewMode('leads'); }}
              className={`group flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl transition-all ${selectedPipelineId === p.id && viewMode === 'leads' ? 'bg-[#6d47df] text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <LayoutGrid size={15} />
              {isSidebarOpen && <span className="text-[11px] font-bold truncate">{p.name}</span>}
            </div>
          ))}

          <button onClick={() => setIsPipelineModalOpen(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[#6d47df] bg-[#6d47df]/5 hover:bg-[#6d47df]/10 rounded-xl transition-all mt-1">
            <Plus size={16} />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase">Novo Funil</span>}
          </button>
        </nav>

        <div className="pt-4 border-t border-slate-200/50 space-y-2">
          <NavItem icon={<Settings2 size={18} />} label="Ajustes" active={viewMode === 'settings'} onClick={() => setViewMode('settings')} isOpen={isSidebarOpen} />
          <div className="flex items-center gap-2.5 px-3 py-2.5 glass rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-[#6d47df]/10 flex items-center justify-center text-[#6d47df] font-black text-[10px]">AD</div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-[9px] font-black text-slate-800">Admin</p>
                <p className="text-[7px] text-slate-400 font-bold uppercase">Master</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 ${isSidebarOpen ? 'ml-60' : 'ml-16'} transition-all duration-300 px-6 py-6 bg-transparent`}>
        {viewMode === 'settings' ? (
          <div className="animate-in max-w-2xl mx-auto py-10">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Ajustes do Sistema</h2>
              <p className="text-slate-500 font-medium">Personalize sua experiência no CRM Elevate</p>
            </div>

            <div className="space-y-8">
              {/* Tema Section */}
              <div className="glass p-8 rounded-[32px] border-white/60 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-[#6d47df]/10 text-[#6d47df] rounded-xl flex items-center justify-center">
                    {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Aparência</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tema Visual</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${theme === 'light' ? 'border-[#6d47df] bg-[#6d47df]/5 shadow-md' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-inner flex items-center justify-center text-[#6d47df]">
                      <Sun size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900">Tema Claro</span>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${theme === 'dark' ? 'border-[#6d47df] bg-[#6d47df]/5 shadow-md' : 'border-slate-100 hover:bg-white/5'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 shadow-inner flex items-center justify-center text-indigo-400">
                      <Moon size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900">Tema Escuro</span>
                  </button>
                </div>
              </div>

              {/* Interface Section */}
              <div className="glass p-8 rounded-[32px] border-white/60 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-[#6d47df]/10 text-[#6d47df] rounded-xl flex items-center justify-center">
                    <Type size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Interface</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Escala de Fonte</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button 
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`py-4 rounded-xl border transition-all font-black uppercase text-[10px] tracking-widest ${fontSize === size ? 'bg-[#6d47df] text-white border-[#6d47df] shadow-md' : 'border-slate-100 hover:bg-slate-50 text-slate-400'}`}
                    >
                      {size === 'small' ? 'Compacto' : size === 'medium' ? 'Padrão' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-8 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4">Elevate CRM Dashboard v5.2.0</p>
                <div className="flex items-center justify-center gap-6">
                  <a href="#" className="text-[9px] font-bold text-slate-400 hover:text-[#6d47df] transition-colors uppercase tracking-widest">Suporte</a>
                  <a href="#" className="text-[9px] font-bold text-slate-400 hover:text-[#6d47df] transition-colors uppercase tracking-widest">Privacidade</a>
                  <a href="#" className="text-[9px] font-bold text-slate-400 hover:text-[#6d47df] transition-colors uppercase tracking-widest">Termos</a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                   <div className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-wider">Ativo</div>
                   <p className="text-[9px] font-bold text-slate-400">CRM / {viewMode.toUpperCase()}</p>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter">
                  {pipelines.find(p => p.id === selectedPipelineId)?.name || 'Vendas'}
                </h2>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                 {/* Campo de Investimento */}
                 <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border-white/60 shadow-sm bg-white/20">
                   <Wallet size={16} className="text-[#6d47df]" />
                   <div className="flex flex-col">
                     <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Investimento Anúncios</span>
                     <input 
                       type="number" 
                       value={adSpend} 
                       onChange={(e) => setAdSpend(Number(e.target.value))} 
                       className="bg-transparent border-none outline-none text-[11px] font-black text-[#6d47df] w-24"
                       placeholder="R$ 0,00"
                     />
                   </div>
                 </div>

                 <div className="flex items-center glass rounded-lg p-0.5 shadow-sm bg-white/30 border-white/50">
                    <button className={`p-2 rounded-md transition-all ${viewMode === 'leads' ? 'bg-[#6d47df] text-white shadow-sm' : 'text-slate-400'}`} onClick={() => setViewMode('leads')}><LayoutGrid size={16} /></button>
                    <button className={`p-2 rounded-md transition-all ${viewMode === 'dashboard' ? 'bg-[#6d47df] text-white shadow-sm' : 'text-slate-400'}`} onClick={() => setViewMode('dashboard')}><BarChart3 size={16} /></button>
                 </div>

                 <label className="flex items-center gap-2 px-4 py-2.5 glass border-white/60 text-slate-800 rounded-xl hover:bg-white/60 transition-all cursor-pointer font-black text-[9px] uppercase tracking-wider shadow-sm">
                   <UploadCloud size={16} className="text-[#6d47df]" /> Planilha
                   <input type="file" className="hidden" accept=".xlsx" onChange={handleGoogleAdsImport} />
                 </label>
                 <button onClick={() => { setEditingLead(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#6d47df] text-white rounded-xl hover:bg-[#5a36c5] transition-all shadow-md font-black text-[9px] uppercase tracking-wider">
                   <Plus size={16} /> Novo Lead
                 </button>
              </div>
            </header>

            <div className="animate-in">
              {viewMode === 'dashboard' ? (
                <div className="space-y-6">
                  <KPISection data={filteredData} />
                  <ChartsSection data={filteredData} adSpend={adSpend} />
                  <DataTable data={filteredData} />
                </div>
              ) : (
                <KanbanBoard 
                  data={filteredData} 
                  onMove={handleMoveLead} 
                  onEdit={(lead) => { setEditingLead(lead); setIsModalOpen(true); }}
                  onDelete={handleDeleteLead}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
          <div className="glass w-full max-w-lg rounded-[28px] p-8 shadow-2xl border-white/60 animate-in relative bg-white/95">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"><X size={20} /></button>
            
            <div className="mb-6">
               <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                 {editingLead ? 'Detalhes do Registro' : 'Novo Registro'}
               </h3>
               <p className="text-slate-400 font-bold mt-0.5 uppercase text-[8px] tracking-widest">Informações do Funil</p>
            </div>
            
            <form onSubmit={handleAddOrEditLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Vendedor</label>
                  <input name="owner" defaultValue={editingLead?.owner || ''} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs focus:ring-2 focus:ring-[#6d47df]/20" placeholder="Responsável" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Valor</label>
                  <input name="amount" type="number" defaultValue={editingLead?.amount || ''} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs focus:ring-2 focus:ring-[#6d47df]/20" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Lead / Empresa</label>
                <input name="commercialName" defaultValue={editingLead?.commercialName || ''} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs focus:ring-2 focus:ring-[#6d47df]/20" placeholder="Nome do contato" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Etapa Atual</label>
                  <select name="stage" defaultValue={editingLead?.stage || DEFAULT_STAGES[0]} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs cursor-pointer focus:ring-2 focus:ring-[#6d47df]/20">
                    {DEFAULT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Origem</label>
                  <select name="source" defaultValue={editingLead?.source || 'Direct'} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs cursor-pointer focus:ring-2 focus:ring-[#6d47df]/20">
                    <option value="Direct">Orgânico</option>
                    <option value="Google">Google Ads</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Observações</label>
                <textarea 
                  name="observations" 
                  defaultValue={editingLead?.observations || ''} 
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-xs resize-none focus:ring-2 focus:ring-[#6d47df]/20" 
                  placeholder="Informações adicionais importantes..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest text-[9px]">Cancelar</button>
                <button type="submit" className="flex-[2] px-6 py-3 bg-[#6d47df] text-white rounded-xl font-black shadow-lg shadow-[#6d47df]/20 uppercase tracking-widest text-[9px]">Salvar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pipeline */}
      {isPipelineModalOpen && (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
          <div className="glass w-full max-w-xs rounded-[24px] p-6 shadow-2xl bg-white border-white">
            <h3 className="text-lg font-black mb-4 tracking-tighter text-slate-900">Novo Funil</h3>
            <form onSubmit={handleCreatePipeline} className="space-y-4">
              <input name="pipelineName" required autoFocus className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-xs" placeholder="Nome do funil" />
              <button type="submit" className="w-full py-3 bg-[#6d47df] text-white rounded-xl font-black shadow-md text-[10px] uppercase tracking-wider">Confirmar</button>
              <button type="button" onClick={() => setIsPipelineModalOpen(false)} className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Fechar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, isOpen: boolean }> = ({ icon, label, active, onClick, isOpen }) => (
  <div onClick={onClick} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl transition-all duration-200 ${active ? 'bg-[#6d47df] text-white shadow-md scale-102' : 'text-slate-500 hover:bg-white/50'}`}>
    {icon}
    {isOpen && <span className="text-[11px] font-bold tracking-tight">{label}</span>}
  </div>
);

export default App;
