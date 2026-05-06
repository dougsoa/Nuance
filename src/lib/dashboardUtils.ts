import { Note, NoteTask, Process } from '../types';
import { format, isToday } from 'date-fns';

export const countTasks = (tasks: NoteTask[]): { total: number, completed: number } => {
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

export const countAllPending = (allNotes: Note[]): number => {
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

export const isOverdue = (task: NoteTask) => {
  if (!task.time || task.completed) return false;
  try {
    const [hours, minutes] = task.time.split(':').map(Number);
    const now = new Date();
    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);
    
    // Consider overdue if after task time + 1 hour
    const limitTime = new Date(taskTime.getTime() + 60 * 60 * 1000);
    return now > limitTime;
  } catch (e) {
    return false;
  }
};

export const hasPendingSubtasks = (task: NoteTask): boolean => {
  if (!task.subtasks || task.subtasks.length === 0) return false;
  return task.subtasks.some(sub => !sub.completed || hasPendingSubtasks(sub));
};

export const getDailyTasksNote = (notes: Note[]) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return notes.find(n => 
    n.isDailyTask && 
    (n.scheduledDate === todayStr || (!n.scheduledDate && isToday(n.createdAt?.toDate ? n.createdAt.toDate() : new Date())))
  );
};
