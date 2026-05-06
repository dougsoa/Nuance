import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-stone-100"
          >
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight mb-2">
                {title}
              </h3>
              
              <p className="text-stone-500 text-sm font-medium leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-stone-500 hover:bg-stone-50 transition-all border border-stone-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
