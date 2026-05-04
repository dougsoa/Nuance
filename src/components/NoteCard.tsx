import { motion } from 'motion/react';
import { CheckCircle2, Circle, Tag, Calendar, MoreVertical, Edit2, Trash2, ListTodo, CheckSquare } from 'lucide-react';
import { Note } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

interface NoteCardProps {
  note: Note;
  onToggleComplete: (id: string, currentStatus: boolean) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onToggleComplete, onEdit, onDelete }: NoteCardProps) {
  const date = note.createdAt?.toDate ? note.createdAt.toDate() : new Date();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={() => onEdit(note)}
      className={`group relative bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        note.completed 
          ? 'opacity-60 border-stone-200 border-dashed bg-stone-50/50' 
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(note.id, note.completed);
          }}
          className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
            note.completed 
              ? 'border-green-500 text-green-500' 
              : 'border-stone-300 text-transparent hover:border-primary group-hover:text-primary/20'
          }`}
        >
          {note.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
        </button>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="p-1.5 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-lg transition-all"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2">
           {note.category && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              note.isDailyTask 
                ? 'bg-primary/10 text-primary' 
                : 'bg-stone-100 text-stone-500'
            }`}>
              {note.isDailyTask && <ListTodo size={11} />}
              {note.category}
            </span>
          )}
        </div>
        <h3 className={`text-lg font-bold tracking-tight ${note.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
          {note.title}
        </h3>

        {note.isDailyTask && note.tasks && note.tasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              <span>Progresso</span>
              <span>
                {Math.round((note.tasks.filter(t => t.completed).length / note.tasks.length) * 100)}%
              </span>
            </div>
            <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(note.tasks.filter(t => t.completed).length / note.tasks.length) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>
            <div className="py-2 space-y-1.5">
              {note.tasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center gap-2 text-xs text-stone-500">
                <div className={`shrink-0 ${task.completed ? 'text-primary' : 'text-stone-300'}`}>
                  {task.completed ? <CheckSquare size={12} /> : <Circle size={12} />}
                </div>
                <span className={`truncate ${task.completed ? 'line-through opacity-50' : ''}`}>
                  {task.text}
                </span>
              </div>
            ))}
            {note.tasks.length > 3 && (
              <p className="text-[10px] text-stone-400 font-bold uppercase pl-5">+ {note.tasks.length - 3} tarefas</p>
            )}
          </div>
        </div>
        )}

        {note.content && (
          <div className="text-sm text-stone-600 line-clamp-2 prose prose-sm prose-stone max-w-none prose-p:leading-relaxed">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {note.tags?.map((tag, idx) => (
            <span key={idx} className="text-[10px] text-stone-400 font-medium tracking-tight">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          {format(date, 'dd MMM', { locale: ptBR })}
        </div>
      </div>
    </motion.div>
  );
}
