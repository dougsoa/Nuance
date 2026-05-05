import React from 'react';
import { motion } from 'motion/react';
import { GitBranch, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Process } from '../types';

interface ProcessCardProps {
  process: Process;
  onClick: (process: Process) => void;
  onEdit: (process: Process) => void;
  onDelete: (id: string) => void;
}

export default function ProcessCard({ process, onClick, onEdit, onDelete }: ProcessCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(process)}
      className="group relative bg-white border border-stone-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
            <GitBranch size={20} />
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(process);
              }}
              className="p-1.5 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-lg transition-all"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(process.id);
              }}
              className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h3 className="text-xl font-black text-stone-900 tracking-tight mb-2 uppercase break-words">
          {process.title}
        </h3>
        
        <p className="text-stone-500 text-sm font-medium line-clamp-2 mb-6">
          {process.description || 'Sem descrição.'}
        </p>
      </div>
    </motion.div>
  );
}
