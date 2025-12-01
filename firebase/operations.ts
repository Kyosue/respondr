import {
    addDoc,
    collection,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { resourceService } from './resources';

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
  updatedBy?: string;
}

const OPERATIONS_COLLECTION = 'operations';

function convertTimestamps<T>(data: T): T {
  // Preserve arrays and convert nested timestamps to Date
  if (data instanceof Timestamp) {
    return data.toDate() as unknown as T;
  }
  if (Array.isArray(data)) {
    return (data as unknown as any[]).map((item) => convertTimestamps(item)) as unknown as T;
  }
  if (data && typeof data === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(data as Record<string, any>)) {
      const value = (data as Record<string, any>)[key];
      if (value instanceof Timestamp) out[key] = value.toDate();
      else out[key] = convertTimestamps(value);
    }
    return out as T;
  }
  return data;
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

    // Kick off post-processing in the background (do not block UI close)
    (async () => {
      try {
        if (Array.isArray(input.resources) && input.resources.length > 0) {
          const batch = writeBatch(db);
          for (const res of input.resources) {
            const resourceRef = doc(db, 'resources', res.resourceId);
            batch.update(resourceRef, {
              availableQuantity: increment(-Math.abs(res.quantity || 0)),
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();

          try {
            for (const res of input.resources) {
              await resourceService.addHistoryEntry(
                res.resourceId,
                'status_changed',
                `Used in operation '${input.title}' - Allocated ${res.quantity}`
              );
            }
          } catch (historyErr) {
            console.warn('Failed to record operation usage in history:', historyErr);
          }
        }
      } catch (e) {
        console.error('Failed post-processing for operation creation:', e);
      }
    })();

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

  async updateOperation(
    operationId: string,
    input: Partial<Omit<OperationRecord, 'id' | 'createdAt' | 'updatedAt'>>,
    updatedBy?: string
  ) {
    const ref = doc(db, OPERATIONS_COLLECTION, operationId);
    
    // Fetch current operation to handle resource changes
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Operation not found');
    const current = convertTimestamps({ id: snap.id, ...snap.data() }) as OperationRecord;

    // Handle resource quantity changes
    if (input.resources && Array.isArray(input.resources)) {
      try {
        const batch = writeBatch(db);
        const currentResourceMap = new Map(
          (current.resources || []).map(r => [r.resourceId, r.quantity])
        );
        const newResourceMap = new Map(
          input.resources.map(r => [r.resourceId, r.quantity])
        );

        // Calculate quantity differences
        const allResourceIds = new Set([
          ...currentResourceMap.keys(),
          ...newResourceMap.keys()
        ]);

        for (const resourceId of allResourceIds) {
          const currentQty = currentResourceMap.get(resourceId) || 0;
          const newQty = newResourceMap.get(resourceId) || 0;
          const diff = newQty - currentQty;

          if (diff !== 0) {
            const resourceRef = doc(db, 'resources', resourceId);
            batch.update(resourceRef, {
              availableQuantity: increment(-diff),
              updatedAt: serverTimestamp(),
            });
          }
        }

        await batch.commit();
      } catch (e) {
        console.error('Failed to update resource quantities:', e);
      }
    }

    // Remove undefined values recursively
    const stripUndefinedDeep = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
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
      updatedAt: serverTimestamp(),
      updatedBy: updatedBy || input.updatedBy,
    });

    await updateDoc(ref, payload);
  },

  async updateStatus(operationId: string, status: OperationRecord['status'], updatedBy?: string) {
    const ref = doc(db, OPERATIONS_COLLECTION, operationId);

    // Fetch current operation to perform idempotent resource returns
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = convertTimestamps({ id: snap.id, ...snap.data() }) as OperationRecord;

    // If transitioning to concluded and not already concluded, return resources
    if (status === 'concluded' && current.status !== 'concluded') {
      try {
        if (Array.isArray(current.resources) && current.resources.length > 0) {
          const batch = writeBatch(db);
          for (const res of current.resources) {
            const resourceRef = doc(db, 'resources', res.resourceId);
            batch.update(resourceRef, {
              availableQuantity: increment(Math.abs(res.quantity || 0)),
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();

          // Record history entries for operation return
          try {
            for (const res of current.resources) {
              await resourceService.addHistoryEntry(
                res.resourceId,
                'status_changed',
                `Returned from operation '${current.title}' - Returned ${res.quantity}`
              );
            }
          } catch (historyErr) {
            console.warn('Failed to record operation return in history:', historyErr);
          }
        }
      } catch (e) {
        console.error('Failed to return resources on conclude:', e);
      }
    }

    const payload: Record<string, any> = { status, updatedAt: serverTimestamp() };
    if (updatedBy) payload.updatedBy = updatedBy;
    await updateDoc(ref, payload);
  },

  async deleteOperation(operationId: string) {
    const ref = doc(db, OPERATIONS_COLLECTION, operationId);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
  },

  async deleteOperationAndReturnResources(operationId: string) {
    const ref = doc(db, OPERATIONS_COLLECTION, operationId);
    const { deleteDoc, getDoc } = await import('firebase/firestore');
    // Fetch operation to return its resources first
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const op = convertTimestamps({ id: snap.id, ...snap.data() }) as OperationRecord;
      if (Array.isArray(op.resources) && op.resources.length > 0) {
        try {
          const batch = writeBatch(db);
          for (const res of op.resources) {
            const resourceRef = doc(db, 'resources', res.resourceId);
            batch.update(resourceRef, {
              availableQuantity: increment(Math.abs(res.quantity || 0)),
              updatedAt: serverTimestamp(),
            });
          }
          await batch.commit();
          // Optional: history entry for return upon deletion
          try {
            for (const res of op.resources) {
              await resourceService.addHistoryEntry(
                res.resourceId,
                'status_changed',
                `Returned from deleted operation '${op.title}' - Returned ${res.quantity}`
              );
            }
          } catch (historyErr) {
            console.warn('Failed to record operation deletion return in history:', historyErr);
          }
        } catch (e) {
          console.error('Failed to return resources on delete:', e);
        }
      }
    }
    await deleteDoc(ref);
  },
};


