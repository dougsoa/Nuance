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
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  }
  
  // Check for a plain object to avoid recursing into Firestore FieldValues or other special objects
  // We use constructor check for speed, and also check if it's a basic object.
  const isPlainObject = obj.constructor === Object || obj.constructor === undefined;
  
  if (isPlainObject) {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          newObj[key] = cleanData(val);
        }
      }
    }
    return newObj;
  }
  
  return obj;
};
