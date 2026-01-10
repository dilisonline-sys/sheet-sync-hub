import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DatabaseInstance } from '@/types';
import { mockDatabases as initialDatabases } from '@/data/mockDatabases';

interface DatabaseContextType {
  databases: DatabaseInstance[];
  addDatabase: (database: Omit<DatabaseInstance, 'id'>) => void;
  updateDatabase: (id: string, updates: Partial<DatabaseInstance>) => void;
  removeDatabase: (id: string) => void;
  getDatabaseById: (id: string) => DatabaseInstance | undefined;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const STORAGE_KEY = 'db_monitor_databases';

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [databases, setDatabases] = useState<DatabaseInstance[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge stored with initial, giving priority to stored
        const storedIds = new Set(parsed.map((db: DatabaseInstance) => db.id));
        const initialFiltered = initialDatabases.filter(db => !storedIds.has(db.id));
        return [...parsed, ...initialFiltered];
      } catch {
        return initialDatabases;
      }
    }
    return initialDatabases;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(databases));
  }, [databases]);

  const addDatabase = (database: Omit<DatabaseInstance, 'id'>) => {
    const id = database.shortName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    setDatabases(prev => [...prev, { ...database, id } as DatabaseInstance]);
  };

  const updateDatabase = (id: string, updates: Partial<DatabaseInstance>) => {
    setDatabases(prev => prev.map(db => db.id === id ? { ...db, ...updates } : db));
  };

  const removeDatabase = (id: string) => {
    setDatabases(prev => prev.filter(db => db.id !== id));
  };

  const getDatabaseById = (id: string) => {
    return databases.find(db => db.id === id);
  };

  return (
    <DatabaseContext.Provider value={{ databases, addDatabase, updateDatabase, removeDatabase, getDatabaseById }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabases = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabases must be used within a DatabaseProvider');
  }
  return context;
};
