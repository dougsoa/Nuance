import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Sparkles, Loader2, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { loginWithEmail, registerWithEmail, resetPassword } from '../lib/firebase';
import { sendWelcomeEmail } from '../services/emailService';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail para recuperar a senha.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await resetPassword(email);
      setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      let message = 'Erro ao enviar e-mail de recuperação.';
      if (err.code === 'auth/user-not-found') {
        message = 'Não existe uma conta com este e-mail.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'O formato do e-mail é inválido.';
      }
      setError(message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
        // Trigger welcome email in the background
        sendWelcomeEmail(email, name).catch(console.error);
      }
    } catch (err: any) {
      console.error(err);
      let message = 'Ocorreu um erro ao processar sua solicitação.';
      
      if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso por outra conta.';
      } else if (err.code === 'auth/invalid-credential') {
        message = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'O formato do e-mail é inválido.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'O login com e-mail/senha não está ativado no Console do Firebase.';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-natural-bg font-sans flex items-center justify-center p-4">
        <div className="relative w-full max-w-md mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-[40px] blur-xl transition duration-1000 hidden sm:block"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-[32px] sm:rounded-[40px] border border-stone-200 p-6 sm:p-8 shadow-2xl shadow-stone-200/50"
          >
            <button 
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setSuccessMessage('');
              }}
              className="absolute left-6 top-6 sm:left-8 sm:top-8 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 sm:mb-6">
                <KeyRound size={24} className="sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight uppercase">
                Recuperar Senha
              </h2>
              <p className="text-stone-500 text-[10px] sm:text-xs mt-2 font-medium uppercase tracking-widest max-w-[200px] mx-auto">
                Enviaremos um link para o seu e-mail
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Seu E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input 
                    type="email"
                    placeholder="exemplo@email.com"
                    required
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-[11px] font-bold uppercase tracking-tight text-center bg-red-50 py-2 rounded-xl border border-red-100">
                  {error}
                </p>
              )}

              {successMessage && (
                <div className="flex flex-col items-center gap-2 text-green-600 text-[11px] font-bold uppercase tracking-tight text-center bg-green-50 p-4 rounded-xl border border-green-100">
                  <CheckCircle2 size={24} />
                  <span>{successMessage}</span>
                </div>
              )}

              {!successMessage && (
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Mail size={18} />
                      <span>Enviar Link</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg font-sans flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-[40px] blur-xl transition duration-1000 hidden sm:block"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white rounded-[32px] sm:rounded-[40px] border border-stone-200 p-6 sm:p-8 shadow-2xl shadow-stone-200/50"
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-4xl shadow-xl shadow-primary/20 mx-auto mb-4 sm:mb-6">
              N
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">
              Nuance
            </h1>
            <p className="text-stone-500 text-[10px] sm:text-sm mt-2 font-medium uppercase tracking-widest">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Nome</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                    <input 
                      type="text"
                      placeholder="Seu nome completo"
                      required
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                <input 
                  type="email"
                  placeholder="exemplo@email.com"
                  required
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                <input 
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isLogin && (
                <div className="flex justify-end pr-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-[10px] font-bold text-stone-400 hover:text-primary uppercase tracking-widest transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-[11px] font-bold uppercase tracking-tight text-center bg-red-50 py-2 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{isLogin ? 'Entrar Agora' : 'Criar Conta'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t border-stone-100">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-stone-400 hover:text-stone-600 text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-colors"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
