import { useState, useEffect } from 'react';
import { X, Tag, Plus, Loader2, CheckCircle2, Circle, Trash2, ListTodo, Search, ArrowRight, CornerDownRight, ChevronRight, ChevronDown, FileDown, Clock, Calendar } from 'lucide-react';
import { Note, NoteTask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Note>) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: Note | null;
  availableNotes?: Note[];
}

interface TaskItemProps {
  task: NoteTask;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onImport: (parentId: string) => void;
  onUpdateTask?: (id: string, updates: Partial<NoteTask>) => void;
  depth?: number;
}

function TaskItem({ task, onToggle, onRemove, onAddSubtask, onImport, onUpdateTask, depth = 0 }: TaskItemProps) {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');
  const [isEditingMeta, setIsEditingMeta] = useState(false);

  const priorities: ('baixa' | 'média' | 'alta')[] = ['baixa', 'média', 'alta'];

  return (
    <div className="space-y-2">
      <motion.div 
        layout
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`flex flex-col gap-2 p-3 rounded-xl group transition-all ${
          task.completed ? 'bg-stone-50/50' : 'bg-gray-50 hover:bg-gray-100/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggle(task.id)}
            className={`shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
          >
            {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          
          <div className="flex-1 min-w-0">
             <span className={`text-sm font-medium block transition-all ${task.completed ? 'text-stone-400 line-through' : 'text-gray-700'}`}>
              {task.text}
            </span>
            <div className="flex items-center gap-2 mt-1">
              {task.priority && (
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  task.priority === 'alta' ? 'bg-red-50 text-red-500' : 
                  task.priority === 'média' ? 'bg-amber-50 text-amber-500' : 'bg-stone-100 text-stone-500'
                }`}>
                  {task.priority}
                </span>
              )}
              {task.time && (
                <span className="text-[9px] font-bold text-stone-400 font-mono flex items-center gap-1">
                  <Clock size={8} /> {task.time}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingMeta(!isEditingMeta)}
              className={`p-1.5 rounded-lg transition-all ${isEditingMeta ? 'bg-stone-200 text-stone-900' : 'text-stone-400 hover:text-stone-900 hover:bg-white shadow-sm'}`}
              title="Prioridade e Horário"
            >
              <Clock size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsAddingSubtask(!isAddingSubtask)}
              className={`transition-all p-1.5 rounded-lg ${isAddingSubtask ? 'bg-primary/10 text-primary' : 'text-stone-400 hover:text-primary hover:bg-white shadow-sm hover:shadow'}`}
              title="Adicionar Subtarefa"
            >
              <CornerDownRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onImport(task.id)}
              className="p-1.5 text-stone-400 hover:text-primary hover:bg-white rounded-lg shadow-sm hover:shadow transition-all"
              title="Importar nota como subtarefa"
            >
              <FileDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(task.id)}
              className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-white rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {isEditingMeta && onUpdateTask && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 pt-3 border-t border-stone-100 overflow-hidden"
          >
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Prioridade:</span>
              <div className="flex gap-1">
                {priorities.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onUpdateTask(task.id, { priority: p === task.priority ? undefined : p })}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                      task.priority === p ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Hora:</span>
               <input 
                type="text" 
                placeholder="09:00"
                className="w-16 bg-stone-50 border border-stone-100 rounded-lg px-2 py-1 text-[10px] font-bold text-stone-900 outline-none focus:border-primary"
                value={task.time || ''}
                onChange={(e) => onUpdateTask(task.id, { time: e.target.value })}
               />
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {isAddingSubtask && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-8 pr-3 py-1 flex items-center gap-2 overflow-hidden"
          >
            <div className="flex-1 relative">
               <input 
                type="text"
                autoFocus
                placeholder="Qual a subtarefa?"
                className="w-full bg-white border border-stone-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-stone-300 focus:shadow-sm transition-all"
                value={subtaskText}
                onChange={(e) => setSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (subtaskText.trim()) {
                      onAddSubtask(task.id, subtaskText.trim());
                      setSubtaskText('');
                      setIsAddingSubtask(false);
                    }
                  }
                  if (e.key === 'Escape') {
                    setIsAddingSubtask(false);
                  }
                }}
              />
            </div>
            <button 
              type="button"
              onClick={() => {
                if (subtaskText.trim()) {
                  onAddSubtask(task.id, subtaskText.trim());
                  setSubtaskText('');
                  setIsAddingSubtask(false);
                }
              }}
              className="bg-primary text-white p-2 rounded-xl transition-all shadow-lg shadow-primary/10 active:scale-95"
            >
              <Plus size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="ml-8 space-y-2 border-l border-stone-100 pl-4 mt-1">
          {task.subtasks.map(sub => (
            <TaskItem 
              key={sub.id} 
              task={sub} 
              onToggle={onToggle} 
              onRemove={onRemove} 
              onAddSubtask={onAddSubtask}
              onImport={onImport}
              onUpdateTask={onUpdateTask}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoteModal({ isOpen, onClose, onSave, onDelete, initialData, availableNotes = [] }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<NoteTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isDailyTask, setIsDailyTask] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isImporting, setIsImporting] = useState(false);
  const [importParentId, setImportParentId] = useState<string | null>(null);
  const [importSearch, setImportSearch] = useState('');
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  const filteredImportNotes = availableNotes.filter(n => 
    n.title.toLowerCase().includes(importSearch.toLowerCase())
  );

  const handleSelectNoteForImport = (note: Note) => {
    setPreviewNote(note);
    const lines = note.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    setSelectedLines(lines);
  };

  const handleConfirmImport = () => {
    if (!previewNote) return;

    if (importParentId) {
      const addTaskToParent = (list: NoteTask[]): NoteTask[] => {
        return list.map(t => {
          if (t.id === importParentId) {
            const newSubtasks = selectedLines.map(line => ({
              id: uuidv4(),
              text: line,
              completed: false
            }));
            return { 
              ...t, 
              subtasks: [...(t.subtasks || []), ...newSubtasks] 
            };
          }
          if (t.subtasks) {
            return { ...t, subtasks: addTaskToParent(t.subtasks) };
          }
          return t;
        });
      };
      setTasks(addTaskToParent(tasks));
    } else {
      const newTasks = selectedLines.map(line => ({
        id: uuidv4(),
        text: line,
        completed: false
      }));

      if (newTasks.length > 0) {
        setTasks([...tasks, ...newTasks]);
      }
    }
    
    // Add a note in content for context
    const importContext = `Notas importadas de: ${previewNote.title}`;
    if (!content.includes(importContext)) {
      setContent(prev => prev ? `${prev}\n\n${importContext}` : importContext);
    }
    
    setIsImporting(false);
    setImportParentId(null);
    setImportSearch('');
    setPreviewNote(null);
    setSelectedLines([]);
  };

  const handleStartImport = (parentId: string | null = null) => {
    setImportParentId(parentId);
    setIsImporting(true);
  };

  const toggleLineSelection = (line: string) => {
    setSelectedLines(prev => 
      prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
    );
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setCategory(initialData.category || '');
      setTags(initialData.tags || []);
      setTasks(initialData.tasks || []);
      setIsDailyTask(!!initialData.isDailyTask);
      setScheduledDate(initialData.scheduledDate || format(new Date(), 'yyyy-MM-dd'));
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setTags([]);
      setTasks([]);
      setIsDailyTask(false);
    }
  }, [initialData, isOpen]);

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      setTasks([...tasks, { id: uuidv4(), text: newTaskText.trim(), completed: false }]);
      setNewTaskText('');
    }
  };

  const toggleTaskRecursive = (id: string, currentTasks: NoteTask[]): NoteTask[] => {
    return currentTasks.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed;
        // If parent is toggled, toggle all children? Maybe not, keep them independent
        return { ...t, completed: newCompleted };
      }
      if (t.subtasks) {
        return { ...t, subtasks: toggleTaskRecursive(id, t.subtasks) };
      }
      return t;
    });
  };

  const toggleTask = (id: string) => {
    setTasks(toggleTaskRecursive(id, tasks));
  };

  const removeTaskRecursive = (id: string, currentTasks: NoteTask[]): NoteTask[] => {
    return currentTasks.filter(t => t.id !== id).map(t => {
      if (t.subtasks) {
        return { ...t, subtasks: removeTaskRecursive(id, t.subtasks) };
      }
      return t;
    });
  };

  const removeTask = (id: string) => {
    setTasks(removeTaskRecursive(id, tasks));
  };

  const addSubtask = (parentId: string, text: string) => {
    const addTaskToParent = (list: NoteTask[]): NoteTask[] => {
      return list.map(t => {
        if (t.id === parentId) {
          return { 
            ...t, 
            subtasks: [...(t.subtasks || []), { id: uuidv4(), text, completed: false }] 
          };
        }
        if (t.subtasks) {
          return { ...t, subtasks: addTaskToParent(t.subtasks) };
        }
        return t;
      });
    };
    setTasks(addTaskToParent(tasks));
  };

  const updateTask = (id: string, updates: Partial<NoteTask>) => {
    const updateInList = (list: NoteTask[]): NoteTask[] => {
      return list.map(t => {
        if (t.id === id) {
          return { ...t, ...updates };
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateInList(t.subtasks) };
        }
        return t;
      });
    };
    setTasks(updateInList(tasks));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      const saveData: Partial<Note> = {
        title,
        content,
        category: isDailyTask ? 'Daily Tasks' : category,
        tags,
        tasks,
        isDailyTask,
      };

      if (isDailyTask) {
        saveData.scheduledDate = scheduledDate;
      }

      await onSave(saveData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
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
          className="relative w-full max-w-2xl bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh]"
        >
          {/* Mobile Handle */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

          <div className="flex-shrink-0 flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 bg-white">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                {initialData ? 'Editar' : 'Criar'}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
                {isDailyTask ? 'Lista de Tarefas' : 'Anotação Geral'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-black active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scroll-smooth scrollbar-hide">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Título do registro</label>
                  <input 
                    type="text"
                    placeholder="O que vamos registrar hoje?"
                    className="w-full text-2xl sm:text-3xl font-bold outline-none placeholder:text-gray-200 bg-transparent py-1 border-b-2 border-transparent focus:border-stone-100 transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDailyTask(!isDailyTask)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-bold transition-all border-2 ${
                      isDailyTask 
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10 text-primary' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 active:bg-gray-50'
                    }`}
                  >
                    <ListTodo size={16} />
                    {isDailyTask ? 'Modo Tarefa: Ativo' : 'Definir como Tarefa'}
                  </button>

                  {isDailyTask && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 border border-stone-100 shadow-inner">
                      <Calendar size={16} className="text-stone-400" />
                      <input 
                        type="date" 
                        className="bg-transparent text-[11px] font-bold text-stone-600 outline-none w-auto"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {!isDailyTask && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Categoria</label>
                    <input 
                      type="text"
                      placeholder="Trabalho, Pessoal..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-medium"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Tags (Organização)</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Adicionar marcadores..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all pr-14 text-sm font-medium"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <button 
                        type="button"
                        onClick={handleAddTag}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-primary active:scale-90 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tags.length > 0 && !isDailyTask && (
                <div className="flex flex-wrap gap-2 px-1">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-xl text-[10px] text-stone-600 font-black uppercase tracking-widest border border-stone-200/50">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="p-0.5 hover:bg-stone-200 rounded-md transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {isDailyTask && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Lista de Tarefas</label>
                    <button 
                      type="button"
                      onClick={() => setIsImporting(!isImporting)}
                      className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      {isImporting ? 'Cancelar' : 'Importar Nota'}
                    </button>
                  </div>

                  {isImporting ? (
                    <div className="bg-gray-50 rounded-3xl p-5 border-2 border-dashed border-gray-200 space-y-4">
                      {/* View logic for dynamic import remains similar but styled for mobile touch */}
                      {!previewNote ? (
                        <>
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              type="text"
                              placeholder="Pesquisar notas..."
                              className="w-full bg-white rounded-2xl pl-12 pr-5 py-3.5 text-sm font-medium outline-none border border-gray-100 shadow-sm focus:border-primary/30 transition-all"
                              value={importSearch}
                              onChange={(e) => setImportSearch(e.target.value)}
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {filteredImportNotes.map(note => (
                              <button
                                key={note.id}
                                type="button"
                                onClick={() => handleSelectNoteForImport(note)}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-md text-left group transition-all active:scale-[0.98]"
                              >
                                <div>
                                  <span className="text-sm font-bold text-gray-900 block">{note.title}</span>
                                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{note.category || 'Sem categoria'}</span>
                                </div>
                                <ArrowRight size={18} className="text-primary opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Extraindo de:</span>
                              <span className="text-sm font-bold text-gray-900">{previewNote.title}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setPreviewNote(null)}
                              className="text-[10px] font-black text-primary uppercase bg-gray-50 p-2 rounded-xl"
                            >
                              Voltar
                            </button>
                          </div>
                          
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {previewNote.content.split('\n').filter(l => l.trim()).map((line, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => toggleLineSelection(line.trim())}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border-2 ${
                                  selectedLines.includes(line.trim()) 
                                    ? 'bg-primary/5 border-primary/40 shadow-inner' 
                                    : 'bg-white border-transparent hover:border-gray-100 shadow-sm'
                                }`}
                              >
                                <div className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  selectedLines.includes(line.trim())
                                    ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20'
                                    : 'bg-gray-50 border-gray-200 text-transparent'
                                }`}>
                                  <Plus size={16} strokeWidth={3} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 leading-tight">{line}</span>
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleConfirmImport}
                            disabled={selectedLines.length === 0}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-30"
                          >
                            Importar {selectedLines.length} Itens
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Adicionar nova tarefa..."
                        className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all pr-32 text-sm font-medium shadow-inner"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => handleStartImport(null)}
                          className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary px-2 transition-colors hidden sm:block"
                        >
                          Importar
                        </button>
                        <button 
                          type="button"
                          onClick={handleAddTask}
                          className="bg-primary text-white p-2.5 rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 active:scale-90 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pb-4">
                    <AnimatePresence mode="popLayout">
                      {tasks.map(task => (
                        <TaskItem 
                          key={task.id} 
                          task={task} 
                          onToggle={toggleTask} 
                          onRemove={removeTask} 
                          onAddSubtask={addSubtask}
                          onImport={handleStartImport}
                          onUpdateTask={updateTask}
                        />
                      ))}
                    </AnimatePresence>
                    {tasks.length === 0 && !isImporting && (
                      <div className="py-12 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-100 rounded-[32px]">
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-gray-200 mb-3">
                          <ListTodo size={32} />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhuma tarefa adicionada</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                  {isDailyTask ? 'Notas e Observações' : 'Conteúdo'}
                </label>
                <div className="bg-gray-50 border border-gray-100 rounded-[32px] p-2 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-inner">
                  <textarea 
                    placeholder="Escreva livremente aqui..."
                    className="w-full h-48 bg-transparent px-4 py-4 outline-none resize-none font-sans text-base leading-relaxed placeholder:text-gray-300"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required={!isDailyTask}
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="flex-shrink-0 flex sm:items-center justify-between gap-4 p-6 sm:p-8 border-t border-gray-100 bg-white shadow-2xl safe-bottom">
            {initialData && initialData.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id!);
                  onClose();
                }}
                className="flex items-center justify-center p-4 rounded-2xl text-red-500 bg-red-50 hover:bg-red-100 active:scale-95 transition-all border border-transparent sm:px-6 sm:text-[10px] sm:font-black sm:uppercase sm:tracking-widest"
              >
                <Trash2 size={24} className="sm:hidden" />
                <span className="hidden sm:inline">Excluir Registro</span>
              </button>
            ) : <div />}
            
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none sm:min-w-[160px] bg-primary text-white p-4 sm:py-4 sm:px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{initialData ? 'Atualizar' : 'Salvar Registro'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

}
