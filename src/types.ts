export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Process {
  id: string;
  title: string;
  description: string;
  userId: string;
  category?: string;
  steps: ProcessStep[];
  createdAt: any;
  updatedAt: any;
}

export interface NoteTask {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'alta' | 'média' | 'baixa';
  time?: string;
  subtasks?: NoteTask[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  completed: boolean;
  tasks?: NoteTask[];
  isDailyTask?: boolean;
  userId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  userId: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
