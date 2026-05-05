import React from 'react';
import { motion } from 'motion/react';
import { 
  ListTodo, 
  StickyNote, 
  GitBranch, 
  TrendingUp, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  LayoutGrid,
  Zap,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Note, Process, NoteTask } from '../types';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  notes: Note[];
  processes: Process[];
  user: any;
  onEditNote: (note: Note) => void;
  onToggleNoteComplete: (id: string, current: boolean) => void;
  onToggleTask: (noteId: string, taskId: string) => void;
  onCreateNote: () => void;
  onCreateTask: () => void;
  openProcesses: () => void;
  openNotes: (category: string | null) => void;
}

export default function Dashboard({ 
  notes, 
  processes, 
  user, 
  onEditNote, 
  onToggleNoteComplete,
  onToggleTask,
  onCreateNote,
  onCreateTask,
  openProcesses,
  openNotes
}: DashboardProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dailyTasksNote = notes.find(n => 
    n.isDailyTask && 
    (n.scheduledDate === todayStr || (!n.scheduledDate && isToday(n.createdAt?.toDate ? n.createdAt.toDate() : new Date())))
  );
  const dailyTasks = dailyTasksNote?.tasks || [];
  
  // Recursive task counting including subtasks
  const countTasks = (tasks: NoteTask[]): { total: number, completed: number } => {
    let total = 0;
    let completed = 0;
    tasks.forEach(t => {
      total++;
      if (t.completed) completed++;
      if (t.subtasks && t.subtasks.length > 0) {
        const sub = countTasks(t.subtasks);
        total += sub.total;
        completed += sub.completed;
      }
    });
    return { total, completed };
  };

  const { total: totalTasks, completed: completedTasks } = countTasks(dailyTasks);
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Recursive task counting for ALL pending tasks across all notes
  const countAllPending = (allNotes: Note[]): number => {
    let count = 0;
    const traverse = (tasks: NoteTask[]) => {
      tasks.forEach(t => {
        if (!t.completed) count++;
        if (t.subtasks) traverse(t.subtasks);
      });
    };
    allNotes.forEach(n => {
      if (n.tasks) traverse(n.tasks);
    });
    return count;
  };

  const totalPendingAll = countAllPending(notes);

  const nonDailyNotes = notes.filter(n => !n.isDailyTask);
  const recentNotes = nonDailyNotes.slice(0, 3);

  // Generate real activities
  const activities = [
    ...notes.map(n => ({
      id: n.id,
      type: n.isDailyTask ? 'task' : 'note',
      text: n.isDailyTask 
        ? `Tarefa para ${n.scheduledDate ? format(new Date(n.scheduledDate + 'T12:00:00'), "dd/MM") : 'hoje'} criada` 
        : `Nota "${n.title}" criada`,
      date: n.createdAt?.toDate ? n.createdAt.toDate() : new Date(),
      icon: n.isDailyTask ? <ListTodo size={14} /> : <StickyNote size={14} />,
      color: n.isDailyTask ? "text-primary" : "text-emerald-500",
      bgColor: n.isDailyTask ? "bg-primary/10" : "bg-emerald-50"
    })),
    ...processes.map(p => ({
      id: p.id,
      type: 'process',
      text: `Processo "${p.title}" atualizado`,
      date: p.updatedAt?.toDate ? p.updatedAt.toDate() : p.createdAt?.toDate ? p.createdAt.toDate() : new Date(),
      icon: <GitBranch size={14} />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50"
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4);
  
  // Weekly Productivity derived from tasks (using current progress as baseline)
  const weeklyProductivity = totalTasks > 0 ? taskProgress : 0;

  const renderTask = (task: NoteTask, depth: number = 0) => (
    <React.Fragment key={task.id}>
      <div className={`flex items-center justify-between group ${depth > 0 ? 'ml-8 mt-4' : ''}`}>
        <div className="flex items-center gap-4">
          <button 
             onClick={() => dailyTasksNote && onToggleTask(dailyTasksNote.id, task.id)}
             className={`shrink-0 transition-all ${task.completed ? 'text-emerald-500' : 'text-stone-300 hover:text-stone-400'}`}
          >
            {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
          </button>
          <div>
            <p className={`font-bold transition-all ${task.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
              {task.text}
            </p>
            <div className="flex items-center gap-2">
              {task.priority && (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${
                  task.priority === 'alta' ? 'bg-red-50 text-red-500' : 
                  task.priority === 'média' ? 'bg-amber-50 text-amber-500' : 'bg-stone-50 text-stone-500'
                }`}>
                  {task.priority}
                </span>
              )}
              {task.time && !task.completed && (
                <span className="text-[11px] font-bold text-stone-400 font-mono mt-1">{task.time}</span>
              )}
            </div>
          </div>
        </div>
        {task.time && task.completed && (
          <span className="text-[11px] font-bold text-stone-400 font-mono">{task.time}</span>
        )}
      </div>
      {task.subtasks?.map(sub => renderTask(sub, depth + 1))}
    </React.Fragment>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight">
              Boa tarde, {user?.displayName?.split(' ')[0] || 'Douglas'}!
            </h2>
            <p className="text-stone-500 font-medium mt-1">Aqui está o que está acontecendo hoje.</p>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </header>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Tarefas de hoje"
            value={totalTasks - completedTasks}
            subtitle="pendentes"
            icon={<ListTodo size={24} />}
            color="bg-primary/10 text-primary"
            progress={taskProgress}
          />
          <KpiCard 
            title="Notas registradas"
            value={nonDailyNotes.length}
            subtitle="notas"
            icon={<StickyNote size={24} />}
            color="bg-emerald-50 text-emerald-600"
          />
          <KpiCard 
            title="Processos ativos"
            value={processes.length}
            subtitle={processes.length === 1 ? "processo" : "processos"}
            icon={<GitBranch size={24} />}
            color="bg-indigo-50 text-indigo-600"
          />
          <KpiCard 
            title="Tarefas pendentes"
            value={totalPendingAll}
            subtitle={totalPendingAll === 1 ? "tarefa / subtarefa" : "tarefas / subtarefas"}
            icon={<ListTodo size={24} />}
            color="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12">
          
          {/* Foco do Dia */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo size={20} className="text-stone-400" />
                  <h3 className="text-xl font-bold text-stone-900 tracking-tight">Foco do dia</h3>
                </div>
                <button 
                  onClick={() => openNotes('Daily Tasks')}
                  className="text-primary font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  Ver todas <ChevronRight size={14} />
                </button>
             </div>
             
             <div className="bg-white border border-stone-200 rounded-[32px] p-8 shadow-sm flex-1 flex flex-col">
                {dailyTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-stone-300 py-10">
                    <ListTodo size={40} strokeWidth={1} />
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-center">Nenhuma tarefa para hoje</p>
                    <button onClick={onCreateTask} className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest">Adicionar agora</button>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {dailyTasks.map(task => renderTask(task))}
                  </div>
                )}
                <button 
                  onClick={() => dailyTasksNote && onEditNote(dailyTasksNote)}
                  className="mt-6 w-full py-4 border-2 border-dashed border-stone-100 rounded-2xl text-[11px] font-black text-stone-400 uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Adicionar tarefa
                </button>
             </div>
          </div>

          {/* Notas Recentes */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote size={20} className="text-stone-400" />
                  <h3 className="text-xl font-bold text-stone-900 tracking-tight">Notas recentes</h3>
                </div>
                <button 
                  onClick={() => openNotes(null)}
                  className="text-primary font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  Ver todas <ChevronRight size={14} />
                </button>
             </div>

             <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-sm divide-y divide-stone-50 flex-1 flex flex-col justify-between">
                <div>
                  {recentNotes.length === 0 ? (
                    <div className="py-20 text-center text-stone-300">
                      <StickyNote size={40} className="mx-auto" strokeWidth={1} />
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Nenhuma nota criada</p>
                    </div>
                  ) : (
                    recentNotes.map(note => (
                      <div 
                        key={note.id} 
                        onClick={() => onEditNote(note)}
                        className="p-4 hover:bg-stone-50 rounded-[24px] transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            <StickyNote size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900">{note.title}</h4>
                            <p className="text-xs text-stone-500 line-clamp-1 max-w-md">
                              {note.content || (note.tasks && note.tasks[0]?.text) || 'Sem conteúdo'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase">
                            {note.createdAt?.toDate ? format(note.createdAt.toDate(), "eeee, HH:mm", { locale: ptBR }) : 'Recentemente'}
                          </span>
                          <ArrowRight size={14} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={onCreateNote}
                  className="w-full py-4 text-xs font-black text-primary uppercase tracking-widest hover:underline mt-2"
                >
                  + Nova anotação
                </button>
             </div>
          </div>

          {/* Atividade Recente */}
          <div className="lg:col-span-12 space-y-4 pt-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-stone-400" />
                  <h3 className="text-xl font-bold text-stone-900 tracking-tight">Atividade recente</h3>
                </div>
                <button className="text-primary font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1">Ver todas <ChevronRight size={14} /></button>
             </div>

             <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 divide-y md:divide-y-0 md:divide-x divide-stone-50">
                  {activities.length === 0 ? (
                    <div className="col-span-2 py-10 text-center text-stone-300">
                      <Clock size={40} className="mx-auto" strokeWidth={1} />
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Nenhuma atividade recente</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        {activities.slice(0, 2).map((activity, idx) => (
                          <ActivityItem 
                            key={`${activity.id}-${idx}`}
                            icon={activity.icon} 
                            text={activity.text} 
                            time={format(activity.date, "eeee, HH:mm", { locale: ptBR })} 
                            color={activity.color} 
                            bgColor={activity.bgColor}
                          />
                        ))}
                      </div>
                      <div className="space-y-1 md:pl-12 pt-1 md:pt-0">
                        {activities.slice(2, 4).map((activity, idx) => (
                          <ActivityItem 
                            key={`${activity.id}-${idx}-right`}
                            icon={activity.icon} 
                            text={activity.text} 
                            time={format(activity.date, "eeee, HH:mm", { locale: ptBR })} 
                            color={activity.color} 
                            bgColor={activity.bgColor}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
             </div>
          </div>

          {/* Insights Section */}
          <div className="lg:col-span-12 space-y-4 pt-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-amber-500" />
              <h3 className="text-xl font-bold text-stone-900 tracking-tight">Insights para você</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InsightCard 
                icon={<TrendingUp className={taskProgress >= 100 ? "text-emerald-500" : "text-primary"} size={20} />}
                text={taskProgress >= 100 
                  ? "Incrível! Você concluiu todas as tarefas de hoje. Aproveite o tempo extra!" 
                  : `Você concluiu ${taskProgress}% das tarefas de hoje. Mantenha o foco!`}
                color={taskProgress >= 100 ? "bg-emerald-50" : "bg-primary/10"}
              />
              
              {(() => {
                const lastUpdate = processes[0]?.updatedAt?.toDate() || processes[0]?.createdAt?.toDate() || new Date();
                const daysDiff = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <InsightCard 
                    icon={<Calendar className={daysDiff > 2 ? "text-amber-500" : "text-indigo-500"} size={20} />}
                    text={processes.length === 0 
                      ? "Que tal mapear seu primeiro processo para otimizar sua rotina?" 
                      : daysDiff === 0 
                        ? "Seus processos estão atualizados. Bom trabalho!"
                        : `Você não atualiza seus processos há ${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}.`}
                    color={daysDiff > 2 ? "bg-amber-50" : "bg-indigo-50"}
                    action={processes.length === 0 ? "Mapear agora" : "Ver processos"}
                    onAction={openProcesses}
                  />
                );
              })()}

              {(() => {
                const notesWithoutTags = nonDailyNotes.filter(n => !n.tags || n.tags.length === 0).length;
                return (
                  <InsightCard 
                    icon={<StickyNote className={notesWithoutTags > 0 ? "text-amber-500" : "text-emerald-500"} size={20} />}
                    text={notesWithoutTags > 0 
                      ? `Você tem ${notesWithoutTags} ${notesWithoutTags === 1 ? 'nota' : 'notas'} sem tags. Organize-as para facilitar a busca!` 
                      : "Todas as suas notas estão devidamente categorizadas com tags. Ótima organização!"}
                    color={notesWithoutTags > 0 ? "bg-amber-50" : "bg-emerald-50"}
                    action={notesWithoutTags > 0 ? "Ver notas" : undefined}
                    onAction={() => openNotes(null)}
                  />
                );
              })()}
            </div>
          </div>

        </div>
      </div>
      
      <footer className="px-8 py-4 bg-[#F8FAFC]/50 backdrop-blur-sm border-t border-stone-200 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-auto">
        <p>Nuance v1.2</p>
        <p>Since 2026 - Quattrus</p>
      </footer>
    </main>
  );
}

function KpiCard({ title, value, subtitle, icon, color, footer, progress }: any) {
  return (
    <div className="bg-white border border-stone-200 rounded-[32px] p-8 shadow-sm group hover:border-primary/20 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-3xl font-black text-stone-900 tracking-tighter uppercase">{value}</span>
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest leading-none mt-1">{subtitle}</span>
        </div>
        
        {progress !== undefined && (
          <div className="h-1.5 w-full bg-stone-50 rounded-full mt-4 overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="h-full bg-primary"
            />
          </div>
        )}

        {footer && (
          <p className="mt-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-t border-stone-50 pt-4">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ icon, text, time, color, bgColor }: any) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 px-4 -mx-4 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-xl ${bgColor} ${color} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <p className="text-sm font-medium text-stone-700">{text}</p>
      </div>
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0 whitespace-nowrap ml-4">{time}</span>
    </div>
  );
}

function InsightCard({ icon, text, color, action, onAction }: any) {
  return (
    <div className="flex items-center gap-4 bg-white border border-stone-200 p-6 rounded-[28px] shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-stone-800 leading-tight">{text}</p>
        {action && (
          <button 
            onClick={onAction}
            className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 hover:underline"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}
