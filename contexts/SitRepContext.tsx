import { SitRep, SitRepFilters, SitRepStats } from '@/types/SitRep';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

interface SitRepState {
  sitreps: SitRep[];
  loading: boolean;
  error: string | null;
  filters: SitRepFilters;
  stats: SitRepStats | null;
}

type SitRepAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SITREPS'; payload: SitRep[] }
  | { type: 'ADD_SITREP'; payload: SitRep }
  | { type: 'UPDATE_SITREP'; payload: SitRep }
  | { type: 'DELETE_SITREP'; payload: string }
  | { type: 'SET_FILTERS'; payload: SitRepFilters }
  | { type: 'SET_STATS'; payload: SitRepStats }
  | { type: 'CLEAR_ERROR' };

// Sample data for demonstration
const sampleSitReps: SitRep[] = [
  {
    id: 'sitrep_1',
    title: 'Heavy Rainfall Alert - Mati City',
    description: 'Continuous heavy rainfall for the past 6 hours causing localized flooding in low-lying areas. Water level rising in major drainage systems.',
    status: 'submitted',
    priority: 'high',
    category: 'disaster',
    location: 'Mati City, Davao Oriental',
    reporter: 'John Dela Cruz',
    reporterContact: '+63 912 345 6789',
    images: [],
    attachments: [],
    tags: ['flooding', 'rainfall', 'emergency'],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdBy: 'user_1',
    updatedBy: 'user_1',
    isDraft: false,
    isArchived: false,
  },
  {
    id: 'sitrep_2',
    title: 'Power Outage - Caraga District',
    description: 'Power outage affecting 3 barangays in Caraga district. Estimated restoration time: 4-6 hours. Backup generators activated at critical facilities.',
    status: 'under_review',
    priority: 'medium',
    category: 'infrastructure',
    location: 'Caraga District, Davao Oriental',
    reporter: 'Maria Santos',
    reporterContact: 'maria.santos@davaooriental.gov.ph',
    images: [],
    attachments: [],
    tags: ['power', 'infrastructure', 'outage'],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdBy: 'user_2',
    updatedBy: 'user_2',
    isDraft: false,
    isArchived: false,
  },
  {
    id: 'sitrep_3',
    title: 'Medical Supply Shortage',
    description: 'Critical shortage of oxygen tanks and basic medical supplies at Davao Oriental Provincial Hospital. Immediate resupply needed.',
    status: 'approved',
    priority: 'critical',
    category: 'medical',
    location: 'Davao Oriental Provincial Hospital',
    reporter: 'Dr. Roberto Garcia',
    reporterContact: '+63 917 123 4567',
    images: [],
    attachments: [],
    tags: ['medical', 'supplies', 'hospital', 'critical'],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    createdBy: 'user_3',
    updatedBy: 'user_3',
    isDraft: false,
    isArchived: false,
  },
  {
    id: 'sitrep_4',
    title: 'Road Closure - Highway 1',
    description: 'Major landslide blocking Highway 1 between Mati and San Isidro. No casualties reported. Clearing operations in progress.',
    status: 'draft',
    priority: 'high',
    category: 'infrastructure',
    location: 'Highway 1, Davao Oriental',
    reporter: 'Engineer Pedro Ramos',
    reporterContact: 'pedro.ramos@dpwh.gov.ph',
    images: [],
    attachments: [],
    tags: ['landslide', 'road', 'closure', 'highway'],
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    createdBy: 'user_4',
    updatedBy: 'user_4',
    isDraft: true,
    isArchived: false,
  },
  {
    id: 'sitrep_5',
    title: 'Security Incident - Governor Generoso',
    description: 'Suspicious activity reported near the municipal hall. Security personnel deployed. No immediate threat detected.',
    status: 'submitted',
    priority: 'low',
    category: 'security',
    location: 'Governor Generoso, Davao Oriental',
    reporter: 'SPO1 Juan Mendoza',
    reporterContact: '+63 918 765 4321',
    images: [],
    attachments: [],
    tags: ['security', 'suspicious', 'municipal'],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    createdBy: 'user_5',
    updatedBy: 'user_5',
    isDraft: false,
    isArchived: false,
  },
];

const initialState: SitRepState = {
  sitreps: sampleSitReps,
  loading: false,
  error: null,
  filters: {},
  stats: null,
};

function sitRepReducer(state: SitRepState, action: SitRepAction): SitRepState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_SITREPS':
      return { ...state, sitreps: action.payload, loading: false };
    case 'ADD_SITREP':
      return { ...state, sitreps: [action.payload, ...state.sitreps] };
    case 'UPDATE_SITREP':
      return {
        ...state,
        sitreps: state.sitreps.map(sitrep =>
          sitrep.id === action.payload.id ? action.payload : sitrep
        ),
      };
    case 'DELETE_SITREP':
      return {
        ...state,
        sitreps: state.sitreps.filter(sitrep => sitrep.id !== action.payload),
      };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

interface SitRepContextType {
  state: SitRepState;
  dispatch: React.Dispatch<SitRepAction>;
  // Actions
  addSitRep: (sitrep: Omit<SitRep, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSitRep: (id: string, updates: Partial<SitRep>) => void;
  deleteSitRep: (id: string) => void;
  setFilters: (filters: SitRepFilters) => void;
  clearFilters: () => void;
  refreshSitReps: () => Promise<void>;
  getFilteredSitReps: () => SitRep[];
}

const SitRepContext = createContext<SitRepContextType | undefined>(undefined);

export function SitRepProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sitRepReducer, initialState);

  const addSitRep = (sitrepData: Omit<SitRep, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSitRep: SitRep = {
      ...sitrepData,
      id: `sitrep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_SITREP', payload: newSitRep });
  };

  const updateSitRep = (id: string, updates: Partial<SitRep>) => {
    const existingSitRep = state.sitreps.find(s => s.id === id);
    if (existingSitRep) {
      const updatedSitRep = {
        ...existingSitRep,
        ...updates,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_SITREP', payload: updatedSitRep });
    }
  };

  const deleteSitRep = (id: string) => {
    dispatch({ type: 'DELETE_SITREP', payload: id });
  };

  const setFilters = (filters: SitRepFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'SET_FILTERS', payload: {} });
  };

  const refreshSitReps = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // In a real app, this would fetch from Firebase or your backend
      // For now, we'll just simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh sitreps' });
    }
  };

  const getFilteredSitReps = (): SitRep[] => {
    let filtered = [...state.sitreps];

    if (state.filters.status) {
      filtered = filtered.filter(sitrep => sitrep.status === state.filters.status);
    }

    if (state.filters.priority) {
      filtered = filtered.filter(sitrep => sitrep.priority === state.filters.priority);
    }

    if (state.filters.category) {
      filtered = filtered.filter(sitrep => sitrep.category === state.filters.category);
    }

    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      filtered = filtered.filter(sitrep =>
        sitrep.title.toLowerCase().includes(searchLower) ||
        sitrep.description.toLowerCase().includes(searchLower) ||
        sitrep.location.toLowerCase().includes(searchLower) ||
        sitrep.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (state.filters.isDraft !== undefined) {
      filtered = filtered.filter(sitrep => sitrep.isDraft === state.filters.isDraft);
    }

    if (state.filters.isArchived !== undefined) {
      filtered = filtered.filter(sitrep => sitrep.isArchived === state.filters.isArchived);
    }

    if (state.filters.dateRange) {
      filtered = filtered.filter(sitrep => {
        const sitrepDate = new Date(sitrep.createdAt);
        return sitrepDate >= state.filters.dateRange!.start && 
               sitrepDate <= state.filters.dateRange!.end;
      });
    }

    // Sort by priority (critical first) then by date (newest first)
    return filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const value: SitRepContextType = {
    state,
    dispatch,
    addSitRep,
    updateSitRep,
    deleteSitRep,
    setFilters,
    clearFilters,
    refreshSitReps,
    getFilteredSitReps,
  };

  return (
    <SitRepContext.Provider value={value}>
      {children}
    </SitRepContext.Provider>
  );
}

export function useSitReps() {
  const context = useContext(SitRepContext);
  if (context === undefined) {
    throw new Error('useSitReps must be used within a SitRepProvider');
  }
  return context;
}
