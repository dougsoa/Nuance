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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh]"
          >
            {/* Mobile Handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            <div className="p-6 sm:p-8 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-inner">
                  <GitBranch className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-stone-900 leading-none truncate">
                    {initialData ? 'Editar' : 'Criar'}
                  </h2>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mt-1">Fluxo de Trabalho</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-stone-50 hover:bg-stone-100 rounded-2xl transition-all text-stone-400 hover:text-stone-900 active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar scroll-smooth">
              <div className="space-y-8">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1">Nome do Fluxo</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Ex: Integração de Novos Clientes"
                    className="w-full text-2xl sm:text-3xl font-black text-stone-900 placeholder:text-stone-200 outline-none border-b-2 border-transparent focus:border-primary/10 transition-all pb-2 bg-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1">Objetivo do Processo</label>
                  <textarea 
                    placeholder="Descreva o que este fluxo resolve..."
                    className="w-full bg-stone-50 border border-stone-100 rounded-3xl p-5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-stone-200 transition-all min-h-[120px] resize-none shadow-inner"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    Etapas estruturadas
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{steps.length}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm shadow-primary/5"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={step.id}
                      className="bg-white border-2 border-stone-100 rounded-[32px] p-6 relative group hover:shadow-xl hover:border-primary/10 transition-all"
                    >
                      <div className="absolute -left-3 top-6 w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center text-[11px] font-black text-white shadow-xl">
                        {index + 1}
                      </div>
                      
                      <div className="space-y-5">
                        <div className="flex items-center gap-4">
                          <input 
                            type="text"
                            placeholder="Título da etapa..."
                            className="flex-1 bg-transparent text-base font-bold text-stone-900 outline-none border-b-2 border-transparent focus:border-primary/20 transition-all py-1 placeholder:text-stone-300"
                            value={step.title}
                            onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(step.id)}
                            className="text-stone-300 hover:text-red-500 transition-colors p-2 bg-stone-50 rounded-xl sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <div className="relative">
                          <textarea 
                            placeholder="Instruções para execução desta etapa..."
                            className="w-full bg-stone-50/50 border border-stone-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-primary/20 transition-all text-stone-600 min-h-[80px] resize-none"
                            value={step.description}
                            onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {steps.length === 0 && (
                    <button 
                      type="button"
                      onClick={handleAddStep}
                      className="w-full border-2 border-dashed border-stone-200 rounded-[40px] p-12 flex flex-col items-center justify-center text-stone-300 hover:border-primary/30 hover:text-primary transition-all group active:scale-[0.98] bg-stone-50/30"
                    >
                      <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:shadow-lg transition-all group-hover:scale-110">
                        <Plus size={32} strokeWidth={3} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em]">Começar a desenhar as etapas</p>
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="p-6 sm:p-8 border-t border-stone-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 safe-bottom shadow-2xl">
               {initialData && initialData.id && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(initialData.id!);
                    onClose();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-red-500 bg-red-50 hover:bg-red-100 active:scale-95 transition-all order-2 sm:order-1 sm:px-6"
                >
                  <Trash2 size={18} />
                  <span>Apagar Fluxo</span>
                </button>
              ) : <div className="hidden sm:block" />}

              <div className="flex gap-4 w-full sm:w-auto order-1 sm:order-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-stone-400 hover:bg-stone-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !title.trim()}
                  className="flex-1 sm:flex-none bg-primary text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sincronizando...' : (initialData ? 'Atualizar' : 'Finalizar')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
