import { MultiResourceTransaction, ResourceTransaction } from '@/types/Resource';
import { useMemo } from 'react';

interface BorrowerCalculations {
  totalTransactions: number;
  activeTransactions: number;
  completedTransactions: number;
  overdueTransactions: number;
  cancelledTransactions: number;
  // All transactions (not just active)
  allSingleTransactions: ResourceTransaction[];
  allMultiTransactions: MultiResourceTransaction[];
  allTransactions: (ResourceTransaction | MultiResourceTransaction)[];
  // Active transactions (for backward compatibility)
  activeSingleTransactions: ResourceTransaction[];
  activeMultiTransactions: MultiResourceTransaction[];
  allActiveTransactions: (ResourceTransaction | MultiResourceTransaction)[];
  // Completed transactions
  completedSingleTransactions: ResourceTransaction[];
  completedMultiTransactions: MultiResourceTransaction[];
  allCompletedTransactions: (ResourceTransaction | MultiResourceTransaction)[];
  // Cancelled transactions
  cancelledSingleTransactions: ResourceTransaction[];
  cancelledMultiTransactions: MultiResourceTransaction[];
  allCancelledTransactions: (ResourceTransaction | MultiResourceTransaction)[];
}

interface UseBorrowerCalculationsProps {
  singleTransactions: ResourceTransaction[];
  multiTransactions: MultiResourceTransaction[];
}

export function useBorrowerCalculations({ 
  singleTransactions, 
  multiTransactions 
}: UseBorrowerCalculationsProps): BorrowerCalculations {
  return useMemo(() => {
    // Helper function to check if a date is overdue
    const isOverdue = (dueDate?: Date): boolean => {
      if (!dueDate) return false;
      
      const now = new Date();
      
      // Handle Firestore Timestamp objects
      if (dueDate && typeof dueDate === 'object' && 'toDate' in dueDate) {
        const firestoreDate = (dueDate as any).toDate();
        if (firestoreDate instanceof Date && !isNaN(firestoreDate.getTime())) {
          return firestoreDate < now;
        }
      }
      
      // Handle regular Date objects or date strings
      const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
      return !isNaN(date.getTime()) && date < now;
    };

    // All transactions (no filtering)
    const allSingleTransactions = [...singleTransactions];
    const allMultiTransactions = [...multiTransactions];
    const allTransactions = [...allSingleTransactions, ...allMultiTransactions];
    
    // Filter by status
    const activeSingleTransactions = singleTransactions.filter(t => t.status === 'active');
    const activeMultiTransactions = multiTransactions.filter(t => 
      t.status === 'active' || t.items.some(item => item.status === 'active')
    );
    
    const completedSingleTransactions = singleTransactions.filter(t => t.status === 'completed');
    const completedMultiTransactions = multiTransactions.filter(t => t.status === 'completed');
    
    const cancelledSingleTransactions = singleTransactions.filter(t => t.status === 'cancelled');
    const cancelledMultiTransactions = multiTransactions.filter(t => t.status === 'cancelled');
    
    // Combine transactions by status
    const allActiveTransactions = [...activeSingleTransactions, ...activeMultiTransactions];
    const allCompletedTransactions = [...completedSingleTransactions, ...completedMultiTransactions];
    const allCancelledTransactions = [...cancelledSingleTransactions, ...cancelledMultiTransactions];
    
    // Calculate totals
    const totalTransactions = singleTransactions.length + multiTransactions.length;
    const activeTransactions = activeSingleTransactions.length + activeMultiTransactions.length;
    const completedTransactions = completedSingleTransactions.length + completedMultiTransactions.length;
    const cancelledTransactions = cancelledSingleTransactions.length + cancelledMultiTransactions.length;
    
    // Calculate overdue items efficiently (only for active transactions)
    const overdueSingle = activeSingleTransactions.filter(t => isOverdue(t.dueDate)).length;
    
    const overdueMulti = activeMultiTransactions.reduce((count, multiT) => {
      return count + multiT.items.filter(item => 
        item.status === 'active' && isOverdue(item.dueDate)
      ).length;
    }, 0);
    
    const overdueTransactions = overdueSingle + overdueMulti;
    
    return {
      totalTransactions,
      activeTransactions,
      completedTransactions,
      overdueTransactions,
      cancelledTransactions,
      // All transactions
      allSingleTransactions,
      allMultiTransactions,
      allTransactions,
      // Active transactions (for backward compatibility)
      activeSingleTransactions,
      activeMultiTransactions,
      allActiveTransactions,
      // Completed transactions
      completedSingleTransactions,
      completedMultiTransactions,
      allCompletedTransactions,
      // Cancelled transactions
      cancelledSingleTransactions,
      cancelledMultiTransactions,
      allCancelledTransactions,
    };
  }, [singleTransactions, multiTransactions]);
}
