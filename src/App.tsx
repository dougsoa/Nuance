/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
import { auth, db } from './lib/firebase';
import { Note, OperationType, Process, NoteTask } from './types';
import { handleFirestoreError } from './lib/utils';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import ProcessModal from './components/ProcessModal';
import ConfirmModal from './components/ConfirmModal';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatePresence, motion } from 'motion/react';
import { StickyNote, Filter, LayoutGrid, User as UserIcon, LogOut, ListTodo, CalendarDays, Plus, X, GitBranch, LayoutDashboard, Menu, CheckCircle2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import ProcessModule from './components/ProcessModule';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'notes' | 'processes'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [isGlobalProcessModalOpen, setIsGlobalProcessModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    const q = query(
      collection(db, 'notes'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(notesData);
      setIsDataLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });

    return unsubscribe;
  }, [user]);

  // Processes Real-time Listener
  useEffect(() => {
    if (!user) {
      setProcesses([]);
      return;
    }

    const q = query(
      collection(db, 'processes'), 
      where('userId', '==', user.uid),
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
  }, [user]);

  const handleSaveProcess = async (data: Partial<Process>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'processes'), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Processo criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar processo.');
      handleFirestoreError(error, OperationType.CREATE, 'processes');
    }
  };

  const handleSaveNote = async (data: Partial<Note>) => {
    if (!user) return;

    try {
      if (editingNote && editingNote.id) {
        const noteRef = doc(db, 'notes', editingNote.id);
        await updateDoc(noteRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        toast.success('Anotação atualizada!');
      } else {
        await addDoc(collection(db, 'notes'), {
          ...data,
          completed: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success('Anotação criada!');
      }
    } catch (error) {
      toast.error('Erro ao salvar.');
      handleFirestoreError(error, editingNote ? OperationType.UPDATE : OperationType.CREATE, 'notes');
    }
  };

  const handleToggleTask = async (noteId: string, taskId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.tasks) return;

    const toggleInList = (list: NoteTask[]): NoteTask[] => {
      return list.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed };
        }
        if (t.subtasks) {
          return { ...t, subtasks: toggleInList(t.subtasks) };
        }
        return t;
      });
    };

    const newTasks = toggleInList(note.tasks);
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, { 
        tasks: newTasks,
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${noteId}`);
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const noteRef = doc(db, 'notes', id);
      const isCompleting = !currentStatus;
      await updateDoc(noteRef, {
        completed: isCompleting,
        completedAt: isCompleting ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${id}`);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNoteIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteIdToDelete) return;
    try {
      await deleteDoc(doc(db, 'notes', noteIdToDelete));
      setNoteIdToDelete(null);
      toast.success('Excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir');
      handleFirestoreError(error, OperationType.DELETE, `notes/${noteIdToDelete}`);
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
    <div className="flex h-screen bg-natural-bg font-sans text-stone-800 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-bg border-r border-stone-200 p-6 flex flex-col shrink-0 overflow-y-auto scrollbar-hide transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:w-64
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between lg:justify-start gap-3 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              N
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Nuance</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-stone-400 hover:text-stone-600 active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-stone-500 font-bold mb-4 px-1">Menu</p>
            <ul className="space-y-1.5">
              <li 
                onClick={() => {
                  setActiveView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeView === 'dashboard' ? 'bg-white shadow-sm border border-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <LayoutDashboard size={16} className={activeView === 'dashboard' ? 'text-primary' : 'text-stone-400'} />
                  Dashboard
                </span>
              </li>
              <li 
                onClick={() => {
                  setSelectedCategory(null);
                  setActiveView('notes');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeView === 'notes' && !selectedCategory ? 'bg-white shadow-sm border border-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <StickyNote size={16} className={activeView === 'notes' && !selectedCategory ? 'text-primary' : 'text-stone-400'} />
                  Notas
                </span>
              </li>
              <li 
                onClick={() => {
                  setSelectedCategory('Daily Tasks');
                  setActiveView('notes');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeView === 'notes' && selectedCategory === 'Daily Tasks' ? 'bg-white shadow-sm border border-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <ListTodo size={16} className={activeView === 'notes' && selectedCategory === 'Daily Tasks' ? 'text-primary' : 'text-stone-400'} />
                  Tarefas
                </span>
              </li>
              <li 
                onClick={() => {
                  setActiveView('processes');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeView === 'processes' ? 'bg-white shadow-sm border border-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <GitBranch size={16} className={activeView === 'processes' ? 'text-primary' : 'text-stone-400'} />
                  Processos
                </span>
              </li>
            </ul>
          </div>

          <div>
             <p className="text-[11px] uppercase tracking-widest text-stone-500 font-bold mb-4 px-1">Ações</p>
             <ul className="space-y-1.5">
                <li 
                  onClick={() => {
                    openCreateModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-stone-600 hover:bg-stone-50 rounded-xl cursor-pointer text-sm font-medium transition-all"
                >
                  <Plus size={16} className="text-stone-400" />
                  Nova Anotação
                </li>
                <li 
                  onClick={() => {
                    openDailyTaskModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-stone-600 hover:bg-stone-50 rounded-xl cursor-pointer text-sm font-medium transition-all"
                >
                  <Plus size={16} className="text-stone-400" />
                  Nova Tarefa
                </li>
                <li 
                  onClick={() => {
                    setIsGlobalProcessModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-stone-600 hover:bg-stone-50 rounded-xl cursor-pointer text-sm font-medium transition-all"
                >
                  <Plus size={16} className="text-stone-400" />
                  Novo Processo
                </li>
             </ul>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-stone-200">
          <div className="mt-4 flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full border border-stone-200 bg-stone-200 flex items-center justify-center text-stone-500 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[11px] font-bold text-stone-900 truncate uppercase tracking-tight">
                 {user?.displayName?.split(' ')[0] || 'Usuário'}
               </p>
               <p className="text-[9px] text-stone-500 truncate">
                 {user?.email}
               </p>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="p-2 text-stone-400 hover:text-red-500 transition-colors shrink-0"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Toolbar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200 shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-stone-600 hover:bg-stone-50 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm">
              N
            </div>
            <span className="font-bold text-stone-900 tracking-tight">Nuance</span>
          </div>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {activeView === 'dashboard' ? (
          isDataLoading ? (
            <DashboardSkeleton />
          ) : (
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
              openNotes={(cat) => {
                setSelectedCategory(cat);
                setActiveView('notes');
              }}
            />
          )
        ) : activeView === 'notes' ? (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 lg:gap-8 bg-white/50 lg:bg-transparent">
              <div className="flex-1 max-w-xl relative group">
                <StickyNote className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder={selectedCategory === 'Daily Tasks' ? "Pesquisar tarefas..." : "Pesquisar anotações..."}
                  className="w-full bg-white border border-stone-200 rounded-2xl py-3 pl-12 pr-10 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    aria-label="Limpar pesquisa"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedCategory === 'Daily Tasks' && (
                  <button 
                    onClick={openDailyTaskModal}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Plus size={18} />
                    Nova Tarefa
                  </button>
                )}
                {selectedCategory !== 'Daily Tasks' && (
                  <button 
                    onClick={openCreateModal}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Plus size={18} />
                    Nova Anotação
                  </button>
                )}
              </div>
            </header>

            <section className="flex-1 p-6 lg:p-8 pt-0 overflow-y-auto custom-scrollbar">
              <div className="mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-3xl font-black tracking-tighter text-stone-900 uppercase">
                  {selectedCategory === 'Daily Tasks' ? 'Minhas Tarefas' : (selectedCategory || 'Minhas Notas')}
                </h2>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-300">
                  <StickyNote size={60} strokeWidth={1} />
                  <p className="mt-4 font-bold uppercase tracking-widest text-xs">Nada encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
                  <AnimatePresence mode="popLayout">
                    {filteredNotes.map(note => (
                      <NoteCard 
                        key={note.id}
                        note={note}
                        onToggleComplete={handleToggleComplete}
                        onEdit={openEditModal}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            <footer className="px-8 py-4 bg-white/50 backdrop-blur-sm border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0">
              <p>Nuance v1.2</p>
              <p className="hidden xs:block">Since 2026 - Quattrus</p>
            </footer>
          </div>
        ) : (
          <ProcessModule 
            userId={user.uid} 
          />
        )}
      </div>

      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        initialData={editingNote}
        availableNotes={notes.filter(n => !n.isDailyTask && n.id !== editingNote?.id)}
      />

      <ProcessModal 
        isOpen={isGlobalProcessModalOpen}
        onClose={() => setIsGlobalProcessModalOpen(false)}
        onSave={handleSaveProcess}
        initialData={null}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setNoteIdToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir?"
        message="Esta ação não pode ser desfeita. Você realmente deseja remover este item?"
      />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

