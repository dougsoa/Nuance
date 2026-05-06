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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[28px] lg:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] lg:max-h-[90vh]"
        >
          <div className="flex-shrink-0 flex items-center justify-between px-6 lg:px-8 py-4 lg:py-6 border-b border-gray-100 bg-white">
            <h2 className="text-lg lg:text-xl font-bold tracking-tight text-gray-900">
              {initialData ? 'Editar Anotação' : 'Nova Anotação'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 scrollbar-hide">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Título</label>
                <input 
                  type="text"
                  placeholder="Ex: Planejamento Diário"
                  className="w-full text-xl lg:text-2xl font-semibold outline-none placeholder:text-gray-200"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            <div className="flex items-center gap-2">
              {isDailyTask && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-100 mr-2">
                  <Calendar size={14} className="text-stone-400" />
                  <input 
                    type="date" 
                    className="bg-transparent text-[10px] lg:text-xs font-bold text-stone-600 outline-none w-24 lg:w-auto"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsDailyTask(!isDailyTask)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] lg:text-xs font-bold transition-all border ${
                  isDailyTask 
                    ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10' 
                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListTodo size={14} />
                Tarefa
              </button>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isDailyTask && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoria</label>
                  <input 
                    type="text"
                    placeholder="Ex: Trabalho"
                    className="w-full bg-gray-50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              )}
              <div className={`space-y-1 ${isDailyTask ? 'col-span-2' : ''}`}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Adicionar Tags</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Pressione Enter"
                    className="w-full bg-gray-50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-black/5 transition-all pr-12 text-sm"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <button 
                    type="button"
                    onClick={handleAddTag}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {isDailyTask && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lista de Tarefas</label>
                    <button 
                      type="button"
                      onClick={() => setIsImporting(!isImporting)}
                      className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                    >
                      {isImporting ? 'Cancelar Importação' : 'Importar de Notas'}
                    </button>
                  </div>

                  {isImporting ? (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-primary/20 space-y-4">
                      {!previewNote ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">
                                {importParentId ? 'Importar como subtarefa' : 'Importar como tarefa'}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                setIsImporting(false);
                                setImportParentId(null);
                              }}
                              className="text-stone-400 hover:text-stone-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                              type="text"
                              placeholder="Pesquisar notas para importar..."
                              className="w-full bg-white rounded-xl pl-10 pr-4 py-2 text-sm outline-none border border-gray-100 focus:border-primary/30 transition-all"
                              value={importSearch}
                              onChange={(e) => setImportSearch(e.target.value)}
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filteredImportNotes.map(note => (
                              <button
                                key={note.id}
                                type="button"
                                onClick={() => handleSelectNoteForImport(note)}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white text-left group transition-all"
                              >
                                <span className="text-sm font-medium text-gray-700 truncate">{note.title}</span>
                                <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                            ))}
                            {filteredImportNotes.length === 0 && (
                              <p className="text-center py-4 text-xs text-gray-400 font-medium italic">Nenhuma nota disponível</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">
                                {importParentId ? 'Importando subtarefas de' : 'Importando tarefas de'}
                              </span>
                              <span className="text-sm font-bold text-gray-900">{previewNote.title}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setPreviewNote(null)}
                              className="text-[10px] font-bold text-primary uppercase"
                            >
                              Voltar
                            </button>
                          </div>
                          
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {previewNote.content.split('\n').filter(l => l.trim()).map((line, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => toggleLineSelection(line.trim())}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                                  selectedLines.includes(line.trim()) 
                                    ? 'bg-primary/5 border border-primary/20' 
                                    : 'bg-white border border-transparent hover:border-gray-200'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  selectedLines.includes(line.trim())
                                    ? 'bg-primary border-primary text-white'
                                    : 'bg-gray-50 border-gray-200 text-transparent'
                                }`}>
                                  <Plus size={14} />
                                </div>
                                <span className="text-sm text-gray-700 leading-tight">{line}</span>
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleConfirmImport}
                            disabled={selectedLines.length === 0}
                            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all shadow-md active:scale-95"
                          >
                            Adicionar {selectedLines.length} Subtarefa(s)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Adicione uma tarefa..."
                        className="w-full bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/5 transition-all pr-12 text-sm"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={() => handleStartImport(null)}
                          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline px-2"
                        >
                          Importar
                        </button>
                        <button 
                          type="button"
                          onClick={handleAddTask}
                          className="bg-primary text-white p-1.5 rounded-lg hover:opacity-90 shadow-sm"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
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
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {isDailyTask ? 'Observações Adicionais' : 'Conteúdo (Markdown)'}
              </label>
              <textarea 
                placeholder="Escreva sua anotação aqui..."
                className="w-full h-48 bg-gray-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none font-sans text-sm leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required={!isDailyTask}
              />
            </div>
          </form>

          <div className="flex-shrink-0 flex justify-between gap-4 p-6 lg:p-8 border-t border-gray-100 bg-gray-50/50">
            {initialData && initialData.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 lg:px-6 py-3 rounded-2xl font-bold text-[10px] lg:text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-transparent"
              >
                <Trash2 size={18} />
                Excluir
              </button>
            ) : <div />}
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-white px-6 lg:px-8 py-3 rounded-2xl font-bold text-xs lg:text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 flex-1 sm:flex-none"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (initialData ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
