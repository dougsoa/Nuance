import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Process, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Plus, Search, X, ChevronRight, CornerDownRight, Info } from 'lucide-react';
import ProcessCard from './ProcessCard';
import ProcessModal from './ProcessModal';
import ConfirmModal from './ConfirmModal';

interface ProcessModuleProps {
  userId: string;
}

export default function ProcessModule({ userId }: ProcessModuleProps) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [processIdToDelete, setProcessIdToDelete] = useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const selectedProcess = processes.find(p => p.id === selectedProcessId);

  useEffect(() => {
    const q = query(
      collection(db, 'processes'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Process[];
      setProcesses(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'processes');
    });

    return unsubscribe;
  }, [userId]);

  const handleSaveProcess = async (data: Partial<Process>) => {
    try {
      if (editingProcess && editingProcess.id) {
        const ref = doc(db, 'processes', editingProcess.id);
        await updateDoc(ref, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'processes'), {
          ...data,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, editingProcess ? OperationType.UPDATE : OperationType.CREATE, 'processes');
    }
  };

  const handleDeleteProcess = (id: string) => {
    setProcessIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!processIdToDelete) return;
    try {
      await deleteDoc(doc(db, 'processes', processIdToDelete));
      if (selectedProcessId === processIdToDelete) setSelectedProcessId(null);
      setProcessIdToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `processes/${processIdToDelete}`);
    }
  };

  const openEditModal = (p: Process) => {
    setEditingProcess(p);
    setIsModalOpen(true);
  };

  const filteredProcesses = processes.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {selectedProcess ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white h-full overflow-hidden">
          <header className="p-8 border-b border-stone-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedProcessId(null)}
                className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all"
              >
                <X size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">{selectedProcess.title}</h2>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Visualizando Fluxo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                onClick={() => openEditModal(selectedProcess)}
                className="px-6 py-3 bg-stone-50 text-stone-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-all border border-stone-100"
              >
                Editar Fluxo
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="bg-primary/5 rounded-[40px] p-10 border border-primary/10">
                 <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Info size={14} />
                   Objetivo do Processo
                 </h3>
                 <p className="text-stone-600 text-lg leading-relaxed font-medium italic">
                   "{selectedProcess.description || 'Nenhuma descrição detalhada fornecida.'}"
                 </p>
              </div>

              <div className="relative space-y-8">
                <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-full ml-[0.5px]" />
                
                {selectedProcess.steps.map((step, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={step.id}
                    className="relative pl-24 group"
                  >
                    <div className="absolute left-0 top-0 w-16 h-16 bg-white border-4 border-stone-50 rounded-full flex items-center justify-center text-xl font-black text-primary shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform z-10">
                      {index + 1}
                    </div>
                    
                    <div className="bg-stone-50 border border-stone-100 rounded-[32px] p-8 transition-all hover:bg-white hover:shadow-xl hover:shadow-stone-200/50">
                      <h4 className="text-lg font-black text-stone-900 uppercase tracking-tight mb-2">
                        {step.title}
                      </h4>
                      <p className="text-stone-500 font-medium leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}

                <div className="pl-24">
                   <div className="bg-stone-900 border border-stone-800 rounded-[32px] p-8 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-black uppercase tracking-tight mb-1 font-lg">Fim do Processo</h4>
                        <p className="text-stone-500 text-sm font-medium">Fluxo concluído com sucesso.</p>
                      </div>
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                        <GitBranch size={24} />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="p-8 flex items-center justify-between gap-8 shrink-0">
            <div className="flex-1 max-w-xl relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Pesquisar processos da área..."
                className="w-full bg-white border border-stone-200 rounded-2xl py-3 pl-12 pr-10 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                setEditingProcess(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={18} />
              Mapear Processo
            </button>
          </header>

          <section className="flex-1 p-8 pt-0 overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tighter text-stone-900 uppercase">
                Meus Processos
              </h2>
            </div>

            {filteredProcesses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-stone-300">
                 <div className="w-24 h-24 bg-stone-100 rounded-[40px] flex items-center justify-center mb-6">
                    <GitBranch size={48} strokeWidth={1.5} />
                 </div>
                 <p className="font-black uppercase tracking-widest text-xs">Nenhum fluxo mapeado ainda</p>
                 <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                 >
                   Começar a documentar agora
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 pb-20">
                <AnimatePresence mode="popLayout">
                  {filteredProcesses.map(p => (
                    <ProcessCard 
                      key={p.id}
                      process={p}
                      onClick={(proc) => setSelectedProcessId(proc.id)}
                      onEdit={openEditModal}
                      onDelete={handleDeleteProcess}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </>
      )}

      <ProcessModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProcess}
        onDelete={handleDeleteProcess}
        initialData={editingProcess}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setProcessIdToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Fluxo?"
        message="Esta ação irá remover permanentemente toda a documentação deste processo."
      />

      <footer className="px-8 py-4 bg-white/50 backdrop-blur-sm border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0">
        <p>Nuance v1.2</p>
        <p>Since 2026 - Quattrus</p>
      </footer>
    </div>
  );
}
