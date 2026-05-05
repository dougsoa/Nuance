import React from 'react';
import { motion } from 'motion/react';
import { GitBranch, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
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
      className="group relative bg-white border border-stone-200 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <GitBranch size={24} />
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(process);
              }}
              className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-xl transition-all"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(process.id);
              }}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <h3 className="text-xl font-black text-stone-900 tracking-tight mb-2 uppercase break-words">
          {process.title}
        </h3>
        
        <p className="text-stone-500 text-sm font-medium line-clamp-2 mb-6">
          {process.description || 'Sem descrição.'}
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-stone-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Etapas</span>
            <span className="text-lg font-black text-stone-900">{process.steps.length}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
