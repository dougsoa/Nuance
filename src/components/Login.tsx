import { motion } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, Sparkles } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6 font-sans">
      <div className="relative w-full max-w-lg">
        {/* Soft glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-xl transition duration-1000"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white rounded-[40px] border border-stone-200 p-12 text-center shadow-2xl shadow-stone-200/50"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-10">
            <Sparkles size={12} />
            Elegância & Simplicidade
          </div>

          <div className="mb-10">
             <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-primary/20 mx-auto mb-6">
                N
             </div>
             <h1 className="text-5xl font-black text-stone-900 leading-none tracking-tighter uppercase">
               Zen<span className="text-primary italic">Notes</span>
             </h1>
          </div>
          
          <p className="text-stone-500 text-lg mb-12 max-w-sm mx-auto font-medium leading-relaxed">
            Organize suas ideias em um ambiente sereno com sincronização em nuvem.
          </p>

          <button 
            onClick={() => signInWithGoogle()}
            className="w-full bg-primary text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 group shadow-lg shadow-primary/20"
          >
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            <span>Entrar com Google</span>
          </button>

          <div className="mt-12 pt-8 border-t border-stone-100">
            <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold">
              Backup Seguro via Google Firebase
            </p>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-12 left-12 flex flex-col gap-2 opacity-5 select-none pointer-events-none">
        <div className="text-stone-900 text-[8vw] font-black uppercase leading-none">NUANCE</div>
        <div className="text-stone-900 text-[8vw] font-black uppercase leading-none opacity-50 italic">SYSTEM</div>
      </div>
    </div>
  );
}
