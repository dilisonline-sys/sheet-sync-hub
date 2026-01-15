import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DailyCheckSummary, WeeklyCheck, CheckStatus } from '@/types';
import { mockDailyChecksByDatabase, generateDailyChecksForDatabase } from '@/data/mockDailyChecks';
import { mockWeeklyChecks as initialWeeklyChecks } from '@/data/mockWeeklyChecks';
import { mockDatabases } from '@/data/mockDatabases';

interface ChecksContextType {
  dailyChecksByDatabase: Record<string, DailyCheckSummary[]>;
  weeklyChecks: WeeklyCheck[];
  saveDailyChecks: (
    databaseId: string,
    date: Date,
    checks: Record<string, CheckStatus>,
    comments: Record<string, string>
  ) => void;
  saveWeeklyChecks: (
    databaseId: string,
    date: Date,
    data: {
      productionDbSize?: string;
      archiveDbSize?: string;
      invalidObjects?: number;
      instanceStartDate?: string;
    }
  ) => void;
  getDailyChecksForDatabase: (databaseId: string) => DailyCheckSummary[];
  getWeeklyChecksForDatabase: (databaseId: string) => WeeklyCheck[];
  clearAllChecks: () => void;
}

const ChecksContext = createContext<ChecksContextType | undefined>(undefined);

const STORAGE_KEY_DAILY = 'db_monitor_daily_checks';
const STORAGE_KEY_WEEKLY = 'db_monitor_weekly_checks';

export const ChecksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dailyChecksByDatabase, setDailyChecksByDatabase] = useState<Record<string, DailyCheckSummary[]>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DAILY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(dbId => {
          parsed[dbId] = parsed[dbId].map((check: any) => ({
            ...check,
            date: new Date(check.date),
          }));
        });
        return { ...mockDailyChecksByDatabase, ...parsed };
      } catch {
        return mockDailyChecksByDatabase;
      }
    }
    return mockDailyChecksByDatabase;
  });

  const [weeklyChecks, setWeeklyChecks] = useState<WeeklyCheck[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_WEEKLY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const converted = parsed.map((check: any) => ({
          ...check,
          weekStartDate: new Date(check.weekStartDate),
          objectsCreated: check.objectsCreated?.map((obj: any) => ({
            ...obj,
            date: new Date(obj.date),
          })),
        }));
        // Merge with initial data, preferring stored data for matching IDs
        const storedIds = new Set(converted.map((c: WeeklyCheck) => c.id));
        const initialFiltered = initialWeeklyChecks.filter(c => !storedIds.has(c.id));
        return [...initialFiltered, ...converted];
      } catch {
        return initialWeeklyChecks;
      }
    }
    return initialWeeklyChecks;
  });

  // Persist to localStorage
  useEffect(() => {
    // Only save user-entered data (entries from today)
    const today = new Date().toDateString();
    const userEntries: Record<string, DailyCheckSummary[]> = {};
    
    Object.keys(dailyChecksByDatabase).forEach(dbId => {
      const todayChecks = dailyChecksByDatabase[dbId].filter(
        check => new Date(check.date).toDateString() === today
      );
      if (todayChecks.length > 0) {
        userEntries[dbId] = todayChecks;
      }
    });
    
    if (Object.keys(userEntries).length > 0) {
      localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(userEntries));
    }
  }, [dailyChecksByDatabase]);

  useEffect(() => {
    const userWeeklyChecks = weeklyChecks.filter(
      check => !initialWeeklyChecks.some(initial => initial.id === check.id)
    );
    if (userWeeklyChecks.length > 0) {
      localStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(userWeeklyChecks));
    }
  }, [weeklyChecks]);

  const saveDailyChecks = (
    databaseId: string,
    date: Date,
    checks: Record<string, CheckStatus>,
    comments: Record<string, string>
  ) => {
    const db = mockDatabases.find(d => d.id === databaseId);
    if (!db) return;

    const dateStr = date.toDateString();
    const checksArray = Object.entries(checks).map(([name, status]) => ({
      name,
      status,
      details: comments[name] || undefined,
    }));

    const newCheck: DailyCheckSummary = {
      date,
      databaseName: db.databaseName,
      instanceName: db.instanceName,
      checks: checksArray,
    };

    setDailyChecksByDatabase(prev => {
      const dbChecks = prev[databaseId] || [];
      // Remove any existing check for the same date
      const filteredChecks = dbChecks.filter(
        check => new Date(check.date).toDateString() !== dateStr
      );
      // Add the new check at the beginning
      return {
        ...prev,
        [databaseId]: [newCheck, ...filteredChecks],
      };
    });
  };

  const saveWeeklyChecks = (
    databaseId: string,
    date: Date,
    data: {
      productionDbSize?: string;
      archiveDbSize?: string;
      invalidObjects?: number;
      instanceStartDate?: string;
    }
  ) => {
    const weekNumber = Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const id = `week${weekNumber}-${databaseId}-${date.getTime()}`;

    const newWeeklyCheck: WeeklyCheck = {
      id,
      weekNumber,
      weekStartDate: date,
      databaseId,
      productionDbSize: data.productionDbSize || undefined,
      archiveDbSize: data.archiveDbSize || undefined,
      invalidObjects: data.invalidObjects,
      instanceStartDate: data.instanceStartDate || undefined,
    };

    setWeeklyChecks(prev => {
      // Check if there's an existing entry for this database and week
      const existingIndex = prev.findIndex(
        check => check.databaseId === databaseId && check.weekNumber === weekNumber
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newWeeklyCheck };
        return updated;
      }
      
      // Add new entry
      return [newWeeklyCheck, ...prev];
    });
  };

  const getDailyChecksForDatabase = (databaseId: string): DailyCheckSummary[] => {
    return dailyChecksByDatabase[databaseId] || [];
  };

  const getWeeklyChecksForDatabase = (databaseId: string): WeeklyCheck[] => {
    return weeklyChecks.filter(check => check.databaseId === databaseId);
  };

  const clearAllChecks = () => {
    setDailyChecksByDatabase({});
    setWeeklyChecks([]);
    localStorage.removeItem(STORAGE_KEY_DAILY);
    localStorage.removeItem(STORAGE_KEY_WEEKLY);
  };

  return (
    <ChecksContext.Provider
      value={{
        dailyChecksByDatabase,
        weeklyChecks,
        saveDailyChecks,
        saveWeeklyChecks,
        getDailyChecksForDatabase,
        getWeeklyChecksForDatabase,
        clearAllChecks,
      }}
    >
      {children}
    </ChecksContext.Provider>
  );
};

export const useChecks = () => {
  const context = useContext(ChecksContext);
  if (context === undefined) {
    throw new Error('useChecks must be used within a ChecksProvider');
  }
  return context;
};
