import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { db } from './config';

export interface OperationResourceRef {
  resourceId: string;
  resourceName: string;
  category: string; // keep as string to avoid cross-import weight
  quantity: number;
  status: 'requested' | 'allocated' | 'in_use' | 'returned';
}

export interface OperationRecord {
  id: string;
  municipalityId: string;
  operationType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'concluded';
  startDate: Date;
  endDate?: Date;
  exactLocation: {
    barangay: string;
    purok: string;
    specificAddress?: string;
  };
  resources: OperationResourceRef[];
  assignedPersonnel: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

const OPERATIONS_COLLECTION = 'operations';

function convertTimestamps<T extends Record<string, any>>(data: T): T {
  const out: Record<string, any> = { ...data };
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (value instanceof Timestamp) out[key] = value.toDate();
    else if (value && typeof value === 'object') out[key] = convertTimestamps(value);
  }
  return out as T;
}

export const operationsService = {
  async createOperation(input: Omit<OperationRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    // Remove undefined values recursively to satisfy Firestore constraints
    const stripUndefinedDeep = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      // Preserve Date and Firestore Timestamp objects as-is
      if (obj instanceof Date || obj instanceof Timestamp) return obj;
      if (Array.isArray(obj)) return obj.map(stripUndefinedDeep);
      if (typeof obj === 'object') {
        const out: any = {};
        Object.keys(obj).forEach((k) => {
          const v = obj[k];
          if (v !== undefined) {
            out[k] = stripUndefinedDeep(v);
          }
        });
        return out;
      }
      return obj;
    };

    const payload = stripUndefinedDeep({
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const ref = await addDoc(collection(db, OPERATIONS_COLLECTION), payload);
    // Return a normalized object with Date values for convenience
    const now = new Date();
    return {
      ...input,
      id: ref.id,
      createdAt: now,
      updatedAt: now,
    } as OperationRecord;
  },

  onAllOperations(callback: (operations: OperationRecord[]) => void) {
    const q = query(collection(db, OPERATIONS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list: OperationRecord[] = snap.docs.map(d => {
        const raw = { id: d.id, ...d.data() } as any;
        const converted = convertTimestamps(raw);
        // Firestore may store dates as Timestamps; ensure Date
        return converted as OperationRecord;
      });
      callback(list);
    });
  },

  async updateStatus(operationId: string, status: OperationRecord['status']) {
    const ref = doc(db, OPERATIONS_COLLECTION, operationId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  },

  async deleteOperation(operationId: string) {
    const ref = doc(db, OPERATIONS_COLLECTION, operationId);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
  },
};


