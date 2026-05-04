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
import { Note, OperationType } from './types';
import { handleFirestoreError } from './lib/utils';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import Login from './components/Login';
import { AnimatePresence, motion } from 'motion/react';
import { StickyNote, Filter, LayoutGrid, User as UserIcon, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });

    return unsubscribe;
  }, [user]);

  const handleSaveNote = async (data: Partial<Note>) => {
    if (!user) return;

    try {
      if (editingNote) {
        const noteRef = doc(db, 'notes', editingNote.id);
        await updateDoc(noteRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          ...data,
          completed: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, editingNote ? OperationType.UPDATE : OperationType.CREATE, 'notes');
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, {
        completed: !currentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${id}`);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
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

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || note.category === selectedCategory;
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
    <div className="flex h-screen bg-natural-bg font-sans text-stone-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar-bg border-r border-stone-200 p-6 flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
            N
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Nuance</h1>
        </div>

        <nav className="flex-1 space-y-8">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-stone-500 font-bold mb-4 px-1">Categorias</p>
            <ul className="space-y-1.5">
              <li 
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  !selectedCategory ? 'bg-white shadow-sm border border-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <LayoutGrid size={16} className={!selectedCategory ? 'text-primary' : 'text-stone-400'} />
                  Todas as notas
                </span>
                <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded-md text-stone-400 font-bold">
                  {notes.length}
                </span>
              </li>
              {categories.map(cat => {
                const count = notes.filter(n => n.category === cat).length;
                return (
                  <li 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedCategory === cat ? 'bg-white shadow-sm border border-stone-100 text-stone-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-sm">
                      <Filter size={16} className={selectedCategory === cat ? 'text-primary' : 'text-stone-400'} />
                      {cat}
                    </span>
                    <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded-md text-stone-400 font-bold">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
             <p className="text-[11px] uppercase tracking-widest text-stone-500 font-bold mb-4 px-1">Ações</p>
             <button 
              onClick={auth.currentUser ? () => auth.signOut() : undefined}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-stone-600 hover:text-red-500 transition-colors text-sm font-medium"
             >
               <LogOut size={16} className="text-stone-400 group-hover:text-red-500 transition-colors" />
               Log Out
             </button>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-stone-200">
           <div className="bg-stone-100/50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <p className="text-[11px] font-bold text-stone-700 leading-none">Nuvem Sincronizada</p>
              <p className="text-[9px] text-stone-500 mt-1 uppercase tracking-tighter">Backup automático ativo</p>
            </div>
          </div>
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
                 {user?.displayName || 'Usuário'}
               </p>
               <p className="text-[9px] text-stone-500 truncate">
                 {user?.email}
               </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-8 flex items-center justify-between gap-8">
           <div className="flex-1 max-w-xl relative group">
            <StickyNote className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar anotações..."
              className="w-full bg-white border border-stone-200 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="text-lg">+</span>
            Nova Anotação
          </button>
        </header>

        <section className="flex-1 p-8 pt-0 overflow-y-auto scrollbar-hide">
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tighter text-stone-900 uppercase">
              {selectedCategory || 'Minhas Notas'}
            </h2>
            <p className="text-sm font-medium text-stone-400 mt-1 uppercase tracking-widest">
              Exibindo {filteredNotes.length} de {notes.length} anotações
            </p>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300">
               <StickyNote size={60} strokeWidth={1} />
               <p className="mt-4 font-bold uppercase tracking-widest text-xs">Nada encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
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

        <footer className="px-8 py-4 bg-white/50 backdrop-blur-sm border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
           <p>Nuance v1.0</p>
           <p>© 2026 Design System</p>
        </footer>
      </main>

      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        initialData={editingNote}
      />
    </div>
  );
}

