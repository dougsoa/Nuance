/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Note, Process } from './types';
import { NoteService, ProcessService } from './services/firestoreService';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import ProcessModal from './components/ProcessModal';
import ConfirmModal from './components/ConfirmModal';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatePresence, motion } from 'motion/react';
import { StickyNote, Filter, LayoutGrid, User as UserIcon, LogOut, ListTodo, CalendarDays, Plus, X, GitBranch, LayoutDashboard, Menu, CheckCircle2, ChevronRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from './lib/utils';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import ProcessModule from './components/ProcessModule';
import MobileNavigation from './components/MobileNavigation';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'notes' | 'processes'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [isGlobalProcessModalOpen, setIsGlobalProcessModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProcessIdFromDashboard, setSelectedProcessIdFromDashboard] = useState<string | null>(null);

  const handleMobileNavChange = (view: string) => {
    if (view === 'dashboard') {
      setActiveView('dashboard');
    } else if (view === 'notes') {
      setSelectedCategory(null);
      setActiveView('notes');
    } else if (view === 'tasks') {
      setSelectedCategory('Daily Tasks');
      setActiveView('notes');
    } else if (view === 'processes') {
      setActiveView('processes');
    }
  };

  const handleMobileAction = (type: 'note' | 'task' | 'process') => {
    if (type === 'note') openCreateModal();
    else if (type === 'task') openDailyTaskModal();
    else if (type === 'process') setIsGlobalProcessModalOpen(true);
  };

  const currentMobileView = 
    activeView === 'dashboard' ? 'dashboard' :
    activeView === 'notes' && selectedCategory === 'Daily Tasks' ? 'tasks' :
    activeView === 'notes' ? 'notes' : 'processes';

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    }, (error) => {
      console.error("Auth observer error", error);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Notes Real-time Listener
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    const unsubscribe = NoteService.subscribe(
      user.uid, 
      (data) => {
        setNotes(data);
        setIsDataLoading(false);
      },
      () => setIsDataLoading(false)
    );

    return unsubscribe;
  }, [user]);

  // Processes Real-time Listener
  useEffect(() => {
    if (!user) {
      setProcesses([]);
      return;
    }

    const unsubscribe = ProcessService.subscribe(user.uid, setProcesses);
    return unsubscribe;
  }, [user]);

  const handleSaveProcess = async (data: Partial<Process>) => {
    if (!user) return;
    try {
      await ProcessService.save(user, data, editingProcess);
      toast.success(editingProcess ? 'Processo atualizado!' : 'Processo criado!');
    } catch (error) {
      toast.error('Erro ao salvar processo.');
    }
  };

  const handleDeleteProcess = async (id: string) => {
    try {
      await ProcessService.delete(id);
      toast.success('Processo excluído!');
    } catch (error) {
      toast.error('Erro ao excluir processo.');
    }
  };

  const handleSaveNote = async (data: Partial<Note>) => {
    if (!user) return;
    try {
      await NoteService.save(user, data, editingNote);
      toast.success(editingNote ? 'Anotação atualizada!' : 'Anotação criada!');
    } catch (error) {
      toast.error('Erro ao salvar.');
    }
  };

  const handleToggleTask = async (noteId: string, taskId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    try {
      await NoteService.toggleTask(note, taskId);
    } catch (error) {
      // Error handled by service
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      await NoteService.toggleComplete(id, currentStatus);
    } catch (error) {
      // Error handled by service
    }
  };

  const handleDeleteNote = (id: string) => {
    setNoteIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteIdToDelete) return;
    try {
      await NoteService.delete(noteIdToDelete);
      setNoteIdToDelete(null);
      toast.success('Excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openDailyTaskModal = () => {
    setEditingNote({
      id: '',
      title: format(new Date(), 'EEEE, dd/MM', { locale: ptBR }),
      content: '',
      category: 'Daily Tasks',
      isDailyTask: true,
      tasks: [],
      completed: false,
      userId: user?.uid || '',
      createdAt: null,
      updatedAt: null,
    } as any);
    setIsModalOpen(true);
  };

  const handleActivityClick = (activity: any) => {
    if (activity.type === 'note' || activity.type === 'task') {
      const note = notes.find(n => n.id === activity.id);
      if (note) {
        openEditModal(note);
      }
    } else if (activity.type === 'process') {
      const process = processes.find(p => p.id === activity.id);
      if (process) {
        setEditingProcess(process);
        setIsGlobalProcessModalOpen(true);
      }
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If no category selected (Notas), show only non-daily tasks
    // Otherwise, show the specifically selected category
    const matchesCategory = !selectedCategory ? !note.isDailyTask : note.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(notes.map(n => n.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-stone-800 overflow-hidden lg:p-4">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar - Modernized for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white rounded-[32px] border border-stone-200/60 shadow-xl shadow-stone-200/20 shrink-0 overflow-hidden">
        <div className="p-8 pb-4">
          <div 
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-3 cursor-pointer group mb-10"
          >
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-all">
              N
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 tracking-tight leading-none">Nuance</h1>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mt-1">Workspace</p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4 px-2">Navegação</p>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'notes', label: 'Anotações', icon: StickyNote },
              { id: 'tasks', label: 'Tarefas Diárias', icon: ListTodo },
              { id: 'processes', label: 'Fluxos de Trabalho', icon: GitBranch },
            ].map((item) => {
              const isActive = 
                item.id === 'dashboard' ? activeView === 'dashboard' :
                item.id === 'processes' ? activeView === 'processes' :
                item.id === 'notes' ? (activeView === 'notes' && selectedCategory === null) :
                item.id === 'tasks' ? (activeView === 'notes' && selectedCategory === 'Daily Tasks') :
                false;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'tasks') {
                      setSelectedCategory('Daily Tasks');
                      setActiveView('notes');
                    } else if (item.id === 'notes') {
                      setSelectedCategory(null);
                      setActiveView('notes');
                    } else {
                      setActiveView(item.id as any);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group relative",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                  )}
                >
                  <item.icon size={18} strokeWidth={2.5} />
                  <span className="text-sm font-bold">{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-hide">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4 px-2">Ações Rápidas</p>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={openCreateModal} className="w-full flex items-center gap-3 px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-600 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all active:scale-95">
                <Plus size={16} className="text-primary" /> Nova Nota
              </button>
              <button onClick={openDailyTaskModal} className="w-full flex items-center gap-3 px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-600 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all active:scale-95">
                <Plus size={16} className="text-primary" /> Nova Tarefa
              </button>
              <button onClick={() => setIsGlobalProcessModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-600 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all active:scale-95">
                <Plus size={16} className="text-primary" /> Novo Fluxo
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 pt-4 bg-stone-50/50">
          <div className="flex items-center gap-3 p-3 bg-white border border-stone-200/60 rounded-3xl shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-black text-sm bg-primary/10 uppercase">
                  {user?.displayName ? user.displayName.charAt(0) : (user?.email?.charAt(0) || 'U')}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-black text-stone-900 truncate">
                 {user?.displayName || 'Usuário'}
               </p>
               <p className="text-[10px] font-bold text-stone-400 truncate tracking-tight uppercase">Spark Plan</p>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="p-2 text-stone-400 hover:text-red-500 bg-stone-50 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-4">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-stone-200 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20">N</div>
            <span className="font-black text-stone-900 tracking-tight">Nuance</span>
          </div>
          <div className="w-8 h-8 rounded-full border border-stone-200 bg-stone-100 flex items-center justify-center overflow-hidden">
             {user?.photoURL ? (
               <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-primary font-black text-xs bg-primary/10 uppercase">
                 {user?.displayName ? user.displayName.charAt(0) : (user?.email?.charAt(0) || 'U')}
               </div>
             )}
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden flex flex-col pb-24 lg:pb-0">
          {activeView === 'dashboard' ? (
            isDataLoading ? <DashboardSkeleton /> : (
              <Dashboard 
                notes={notes} 
                processes={processes} 
                user={user}
                onEditNote={openEditModal}
                onToggleNoteComplete={handleToggleComplete}
                onToggleTask={handleToggleTask}
                onCreateNote={openCreateModal}
                onCreateTask={openDailyTaskModal}
                openProcesses={() => setActiveView('processes')}
                openNotes={(cat) => { setSelectedCategory(cat); setActiveView('notes'); }}
                onActivityClick={handleActivityClick}
              />
            )
          ) : activeView === 'notes' ? (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/40 lg:rounded-[32px] lg:border lg:border-stone-200/60 lg:mb-4 lg:shadow-inner">
               {/* Search & Actions Bar */}
               <header className="p-6 lg:p-10 pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-stone-900 tracking-tighter uppercase mb-1">
                      {selectedCategory === 'Daily Tasks' ? 'Planejamento' : (selectedCategory || 'Anotações')}
                    </h2>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Explore seus pensamentos</p>
                  </div>
                  
                  <div className="flex-1 max-w-xl flex items-center gap-4">
                    <div className="flex-1 relative group">
                      <StickyNote className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 font-bold" size={18} />
                      <input 
                        type="text"
                        placeholder="Busca universal..."
                        className="w-full bg-white border border-stone-200 rounded-[24px] py-4 pl-14 pr-12 text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600 transition-colors"
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                    
                    <button 
                      onClick={selectedCategory === 'Daily Tasks' ? openDailyTaskModal : openCreateModal}
                      className="hidden sm:flex items-center gap-2 bg-primary text-white p-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all shrink-0 px-6 whitespace-nowrap"
                    >
                      <Plus size={18} strokeWidth={3} />
                      {selectedCategory === 'Daily Tasks' ? 'Nova Tarefa' : 'Nova Nota'}
                    </button>
                  </div>
               </header>

               <section className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                  {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-stone-50/50 rounded-[40px] border-2 border-dashed border-stone-100">
                      <div className="p-6 bg-white rounded-3xl shadow-sm text-stone-200 mb-4"><StickyNote size={48} /></div>
                      <p className="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">Nenhum registro encontrado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                      <AnimatePresence mode="popLayout">
                        {filteredNotes.map(note => (
                          <NoteCard key={note.id} note={note} onToggleComplete={handleToggleComplete} onEdit={openEditModal} onDelete={handleDeleteNote} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
               </section>
            </div>
          ) : (
            <ProcessModule userId={user.uid} initialSelectedProcessId={selectedProcessIdFromDashboard} />
          )}
        </div>
      </main>

      {/* Mobile Navigation - Only visible on small screens */}
      <MobileNavigation 
        activeView={currentMobileView as any}
        setActiveView={handleMobileNavChange as any}
        onAction={handleMobileAction}
      />

      {/* Modals & Overlay Utilities */}
      <NoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveNote} onDelete={handleDeleteNote} initialData={editingNote} availableNotes={notes.filter(n => !n.isDailyTask && n.id !== editingNote?.id)} />
      <ProcessModal isOpen={isGlobalProcessModalOpen} onClose={() => { setIsGlobalProcessModalOpen(false); setEditingProcess(null); }} onSave={handleSaveProcess} onDelete={handleDeleteProcess} initialData={editingProcess} />
      <ConfirmModal isOpen={isConfirmOpen} onClose={() => { setIsConfirmOpen(false); setNoteIdToDelete(null); }} onConfirm={confirmDelete} title="Excluir?" message="Esta ação não pode ser desfeita. Você realmente deseja remover este item?" />
    </div>
  );
}

