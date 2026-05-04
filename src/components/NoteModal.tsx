import { useState, useEffect } from 'react';
import { X, Tag, Plus, Loader2, CheckCircle2, Circle, Trash2, ListTodo, Search, ArrowRight } from 'lucide-react';
import { Note, NoteTask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Note>) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: Note | null;
  availableNotes?: Note[];
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
  const [isImporting, setIsImporting] = useState(false);
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

    const newTasks = selectedLines.map(line => ({
      id: uuidv4(),
      text: line,
      completed: false
    }));

    if (newTasks.length > 0) {
      setTasks([...tasks, ...newTasks]);
      
      // Add a note in content for context
      const importContext = `Notas importadas de: ${previewNote.title}`;
      if (!content.includes(importContext)) {
        setContent(prev => prev ? `${prev}\n\n${importContext}` : importContext);
      }
    }
    
    setIsImporting(false);
    setImportSearch('');
    setPreviewNote(null);
    setSelectedLines([]);
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

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      await onSave({
        title,
        content,
        category: isDailyTask ? 'Daily Tasks' : category,
        tags,
        tasks,
        isDailyTask,
      });
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
          className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              {initialData ? 'Editar Anotação' : 'Nova Anotação'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-1 flex-1 mr-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Título</label>
                <input 
                  type="text"
                  placeholder="Ex: Planejamento Diário"
                  className="w-full text-2xl font-semibold outline-none placeholder:text-gray-200"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setIsDailyTask(!isDailyTask)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isDailyTask 
                    ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10' 
                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListTodo size={14} />
                Daily Task
              </button>
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
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Importando de</span>
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
                            Adicionar {selectedLines.length} Tarefa(s)
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
                      <button 
                        type="button"
                        onClick={handleAddTask}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white p-1.5 rounded-lg hover:opacity-90 shadow-sm"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {tasks.map(task => (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group transition-all hover:bg-gray-100/50"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`transition-colors ${task.completed ? 'text-primary' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <span className={`flex-1 text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {task.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
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

          <div className="flex-shrink-0 flex justify-between p-8 border-t border-gray-100 bg-gray-50/50">
            {initialData && initialData.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-transparent"
              >
                <Trash2 size={18} />
                Excluir
              </button>
            ) : <div />}
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (initialData ? 'Atualizar' : 'Salvar Anotação')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
