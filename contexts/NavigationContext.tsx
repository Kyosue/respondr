import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Municipality } from '@/data/davaoOrientalData';

interface NavigationContextType {
  municipalityToOpen: Municipality | null;
  setMunicipalityToOpen: (municipality: Municipality | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [municipalityToOpen, setMunicipalityToOpen] = useState<Municipality | null>(null);

  return (
    <NavigationContext.Provider value={{ municipalityToOpen, setMunicipalityToOpen }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

