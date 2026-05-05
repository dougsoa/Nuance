import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, GitBranch, GripVertical, ChevronRight, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { Process, ProcessStep } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Process>) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: Process | null;
}

export default function ProcessModal({ isOpen, onClose, onSave, onDelete, initialData }: ProcessModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setSteps(initialData.steps || []);
    } else {
      setTitle('');
      setDescription('');
      setSteps([]);
    }
  }, [initialData, isOpen]);

  const handleAddStep = () => {
    const newStep: ProcessStep = {
      id: uuidv4(),
      title: '',
      description: '',
      order: steps.length
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (id: string, updates: Partial<ProcessStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        title,
        description,
        steps: steps.filter(s => s.title.trim() !== '')
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <GitBranch size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">
                    {initialData ? 'Editar Processo' : 'Novo Processo'}
                  </h2>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Fluxo de Trabalho</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-6">
                 <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Título do Processo</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Ex: Onboarding de Novos Colaboradores"
                    className="w-full text-2xl font-black text-stone-900 placeholder:text-stone-200 outline-none border-b-2 border-transparent focus:border-primary/20 transition-all pb-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Descrição Geral</label>
                  <textarea 
                    placeholder="Descreva o objetivo deste fluxo..."
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm outline-none focus:border-stone-300 transition-all min-h-[100px] resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                    Etapas do Fluxo
                    <span className="bg-stone-100 text-stone-400 px-2 py-0.5 rounded-md text-[10px]">{steps.length}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus size={14} />
                    Adicionar Etapa
                  </button>
                </div>

                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={step.id}
                      className="bg-stone-50 border border-stone-100 rounded-3xl p-6 relative group"
                    >
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-stone-100 rounded-full flex items-center justify-center text-[10px] font-black text-stone-400 shadow-sm">
                        {index + 1}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <input 
                            type="text"
                            placeholder="Nome da etapa..."
                            className="flex-1 bg-transparent text-sm font-bold text-stone-900 outline-none border-b border-transparent focus:border-primary/20 transition-all py-1"
                            value={step.title}
                            onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(step.id)}
                            className="text-stone-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <input 
                          type="text"
                          placeholder="Instruções curtas para esta etapa..."
                          className="w-full bg-white/50 border border-stone-100 rounded-xl px-4 py-2 text-xs outline-none focus:border-stone-200 transition-all font-medium text-stone-600"
                          value={step.description}
                          onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  ))}

                  {steps.length === 0 && (
                    <div 
                      onClick={handleAddStep}
                      className="border-2 border-dashed border-stone-200 rounded-[32px] p-10 flex flex-col items-center justify-center text-stone-400 hover:border-primary/30 hover:text-primary transition-all cursor-pointer group"
                    >
                      <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Clique para organizar as etapas</p>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-stone-100 bg-stone-50/50 flex justify-between items-center">
               {initialData && initialData.id && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(initialData.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>
              ) : <div />}

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !title.trim()}
                  className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Fluxo'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
