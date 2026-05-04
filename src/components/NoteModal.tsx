import { useState, useEffect } from 'react';
import { X, Tag, Plus, Loader2 } from 'lucide-react';
import { Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Note>) => Promise<void>;
  initialData?: Note | null;
}

export default function NoteModal({ isOpen, onClose, onSave, initialData }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setCategory(initialData.category || '');
      setTags(initialData.tags || []);
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setTags([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setLoading(true);
    try {
      await onSave({
        title,
        content,
        category,
        tags,
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
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Título</label>
              <input 
                type="text"
                placeholder="Ex: Reunião de Planejamento"
                className="w-full text-2xl font-semibold outline-none placeholder:text-gray-200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoria</label>
                <input 
                  type="text"
                  placeholder="Ex: Trabalho"
                  className="w-full bg-gray-50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Adicionar Tags</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Pressione Enter"
                    className="w-full bg-gray-50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-black/5 transition-all pr-12"
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
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Conteúdo (Markdown)</label>
              <textarea 
                placeholder="Escreva sua anotação aqui..."
                className="w-full h-48 bg-gray-50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none font-mono text-sm leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
          </form>

          <div className="flex-shrink-0 flex justify-end p-8 border-t border-gray-100 bg-gray-50/50">
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
