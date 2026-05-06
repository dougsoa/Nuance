import { auth } from './firebase';
import { OperationType, FirestoreErrorInfo } from '../types';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

// Helper to remove undefined fields from objects and arrays before sending to Firestore
export const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  }
  
  // Check for a plain object to avoid recursing into Firestore FieldValues or other special objects
  const isPlainObject = obj !== null && typeof obj === 'object' && (obj.constructor === Object || obj.constructor === undefined);
  
  if (isPlainObject) {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        newObj[key] = cleanData(obj[key]);
      }
    });
    return newObj;
  }
  
  return obj;
};
