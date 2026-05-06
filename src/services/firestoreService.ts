import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { Note, NoteTask, OperationType, Process } from '../types';
import { handleFirestoreError, cleanData } from '../lib/utils';

export const NoteService = {
  subscribe: (userId: string, onUpdate: (notes: Note[]) => void, onError?: (err: any) => void): Unsubscribe => {
    const q = query(
      collection(db, 'notes'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      onUpdate(notesData);
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });
  },

  save: async (user: User, data: Partial<Note>, editingNote: Note | null) => {
    const cleanedData = cleanData(data);
    try {
      if (editingNote && editingNote.id) {
        const noteRef = doc(db, 'notes', editingNote.id);
        await updateDoc(noteRef, {
          ...cleanedData,
          updatedAt: serverTimestamp(),
        });
        return { type: 'update' as const, id: editingNote.id };
      } else {
        const docRef = await addDoc(collection(db, 'notes'), {
          ...cleanedData,
          completed: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { type: 'create' as const, id: docRef.id };
      }
    } catch (error) {
      handleFirestoreError(error, editingNote ? OperationType.UPDATE : OperationType.CREATE, 'notes');
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
      throw error;
    }
  },

  toggleComplete: async (id: string, currentStatus: boolean) => {
    try {
      const noteRef = doc(db, 'notes', id);
      const isCompleting = !currentStatus;
      await updateDoc(noteRef, {
        completed: isCompleting,
        completedAt: isCompleting ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${id}`);
      throw error;
    }
  },

  toggleTask: async (note: Note, taskId: string) => {
    if (!note.tasks) return;

    const processToggle = (tasks: NoteTask[]): { updatedTasks: NoteTask[], found: boolean } => {
      let foundInScope = false;
      const newList = tasks.map(task => {
        let updatedTask = { ...task };

        if (task.id === taskId) {
          foundInScope = true;
          const targetStatus = !task.completed;
          updatedTask.completed = targetStatus;
          
          if (updatedTask.subtasks && updatedTask.subtasks.length > 0) {
            const setStatusRecursive = (subs: NoteTask[]): NoteTask[] => 
              subs.map(s => ({
                ...s,
                completed: targetStatus,
                subtasks: s.subtasks ? setStatusRecursive(s.subtasks) : undefined
              }));
            updatedTask.subtasks = setStatusRecursive(updatedTask.subtasks);
          }
        } else if (task.subtasks && task.subtasks.length > 0) {
          const result = processToggle(task.subtasks);
          if (result.found) {
            foundInScope = true;
            updatedTask.subtasks = result.updatedTasks;
            const allSubsDone = updatedTask.subtasks.every(s => s.completed);
            updatedTask.completed = allSubsDone;
          }
        }

        return updatedTask;
      });

      return { updatedTasks: newList, found: foundInScope };
    };

    const { updatedTasks } = processToggle(note.tasks);
    try {
      const noteRef = doc(db, 'notes', note.id);
      await updateDoc(noteRef, cleanData({ 
        tasks: updatedTasks,
        updatedAt: serverTimestamp() 
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${note.id}`);
      throw error;
    }
  }
};

export const ProcessService = {
  subscribe: (userId: string, onUpdate: (processes: Process[]) => void, onError?: (err: any) => void): Unsubscribe => {
    const q = query(
      collection(db, 'processes'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Process[];
      onUpdate(data);
    }, (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'processes');
    });
  },

  save: async (user: User, data: Partial<Process>, editingProcess: Process | null) => {
    const cleanedData = cleanData(data);
    try {
      if (editingProcess && editingProcess.id) {
        const processRef = doc(db, 'processes', editingProcess.id);
        await updateDoc(processRef, {
          ...cleanedData,
          updatedAt: serverTimestamp(),
        });
        return { type: 'update' as const, id: editingProcess.id };
      } else {
        const docRef = await addDoc(collection(db, 'processes'), {
          ...cleanedData,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { type: 'create' as const, id: docRef.id };
      }
    } catch (error) {
      handleFirestoreError(error, editingProcess ? OperationType.UPDATE : OperationType.CREATE, 'processes');
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'processes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `processes/${id}`);
      throw error;
    }
  }
};
