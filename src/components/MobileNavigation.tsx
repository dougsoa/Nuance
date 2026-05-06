import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  StickyNote, 
  GitBranch, 
  Plus, 
  X,
  PlusCircle,
  CheckCircle2,
  ListTodo,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';

interface MobileNavigationProps {
  activeView: 'dashboard' | 'notes' | 'processes';
  setActiveView: (view: 'dashboard' | 'notes' | 'processes') => void;
  onAction: (type: 'note' | 'task' | 'process') => void;
}

export default function MobileNavigation({ activeView, setActiveView, onAction }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItemsLeft = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'notes', label: 'Notas', icon: StickyNote },
  ];

  const navItemsRight = [
    { id: 'tasks', label: 'Tarefas', icon: ListTodo },
    { id: 'processes', label: 'Fluxos', icon: GitBranch },
  ];

  const actions = [
    { id: 'note', label: 'Nova Nota', icon: PlusCircle, color: 'text-blue-500' },
    { id: 'task', label: 'Nova Tarefa', icon: ListTodo, color: 'text-emerald-500' },
    { id: 'process', label: 'Novo Fluxo', icon: GitBranch, color: 'text-purple-500' },
    { id: 'logout', label: 'Sair da Conta', icon: LogOut, color: 'text-red-500' },
  ];

  return (
    <>
      {/* Action Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-32 left-4 right-4 z-[120] flex flex-col gap-3"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-4 shadow-2xl border border-white/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 text-center mb-4 pt-2">Operações Rápidas</p>
                <div className="grid grid-cols-1 gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.id === 'logout') {
                          auth.signOut();
                        } else {
                          onAction(action.id as any);
                        }
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-4 w-full p-4 hover:bg-stone-50 rounded-2xl transition-all active:scale-[0.98] group"
                    >
                      <div className={cn("p-3 rounded-xl bg-white shadow-sm group-active:shadow-inner transition-all", action.color)}>
                        <action.icon size={22} />
                      </div>
                      <span className="font-bold text-stone-800">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[105] w-[95%] max-w-lg lg:hidden">
        <div className="bg-stone-950/95 backdrop-blur-2xl rounded-[32px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between relative">
          
          {/* Nav Items - Left */}
          <div className="flex items-center justify-around flex-1 px-1">
            {navItemsLeft.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative",
                  activeView === item.id ? "text-white" : "text-stone-500"
                )}
              >
                <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} />
                {activeView === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Plus Button - Center Container */}
          <div className="w-16 h-12 flex items-center justify-center">
            <div className="absolute left-1/2 -top-6 -translate-x-1/2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-[0_10px_30px_rgba(var(--color-primary),0.3)] transition-all active:scale-90 border-4 border-stone-950",
                  isMenuOpen ? "bg-white text-stone-900 rotate-45" : "bg-primary text-white"
                )}
              >
                <Plus size={32} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Nav Items - Right */}
          <div className="flex items-center justify-around flex-1 px-1">
            {navItemsRight.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative",
                  activeView === item.id ? "text-white" : "text-stone-500"
                )}
              >
                <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} />
                {activeView === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
                  />
                )}
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
