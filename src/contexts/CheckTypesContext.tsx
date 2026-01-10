import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CheckTypeCategory {
  id: string;
  name: string;
  description: string;
  databaseTypes: string[]; // Which database types use this category
}

export interface CheckTypesContextType {
  dailyCheckTypes: Record<string, string[]>; // categoryId -> checks
  weeklyCheckTypes: Record<string, string[]>;
  categories: CheckTypeCategory[];
  addDailyCheck: (categoryId: string, checkName: string) => void;
  removeDailyCheck: (categoryId: string, checkName: string) => void;
  addWeeklyCheck: (categoryId: string, checkName: string) => void;
  removeWeeklyCheck: (categoryId: string, checkName: string) => void;
  getDailyChecksForDatabaseType: (type: string) => string[];
  getWeeklyChecksForDatabaseType: (type: string) => string[];
  resetToDefaults: () => void;
}

const defaultCategories: CheckTypeCategory[] = [
  { id: 'standard', name: 'Standard Databases', description: 'Primary, Standby, Archive, GIS, Pilot databases', databaseTypes: ['primary', 'standby', 'archive', 'gis', 'pilot'] },
  { id: 'oem', name: 'OEM', description: 'Oracle Enterprise Manager', databaseTypes: ['oem'] },
  { id: 'audit_vault', name: 'Audit Vault', description: 'Oracle Audit Vault', databaseTypes: ['audit_vault'] },
  { id: 'firewall', name: 'Firewall', description: 'Database Firewall', databaseTypes: ['firewall'] },
];

const defaultDailyCheckTypes: Record<string, string[]> = {
  standard: [
    'DB Instance Availability',
    'Alert Log: Errors and Warnings',
    'Active Session Count',
    'DB Full Backup',
    'Archive Log Backup',
    'DB Load from OEM',
    'DB Jobs',
    'Check Cluster Services',
    'Check SCAN Services',
    'Long Running Queries',
    'Database Locks',
    'Listener Status',
    'Connection Test',
  ],
  oem: [
    'OMS Status',
    'Instance Availability',
    'Errors and Warnings',
    'AWR Reports',
    'DB Full Backup',
    'DB Jobs',
    'Long Running Queries',
    'Repository DB Availability',
    'Repository DB Space',
    'Management Agents Status',
    'Agent Version Validation',
    'Database Targets Reachable',
    'Critical Alerts Review',
    'Performance Charts Review',
    'Compliance Standards Review',
  ],
  audit_vault: [
    'Instance Availability',
    'System Status CPU',
    'System Status Memory',
    'System Status Disk Space',
    'Audit Trail Collection',
    'Repository Growth Monitoring',
    'Agents Online Status',
    'Agents Collecting Data',
    'Upload Backlog',
    'Upload Connectivity',
    'Logs Review',
  ],
  firewall: [
    'Instance Availability',
    'Firewall Policies Active',
    'Blocking Rules Validation',
    'Alerting Rules Validation',
  ],
};

const defaultWeeklyCheckTypes: Record<string, string[]> = {
  standard: [
    'Production DB Size',
    'Archive DB Size',
    'Invalid Objects Count',
    'Instance Start Date',
    'Tablespace Usage',
  ],
  oem: [
    'Repository DB Size',
    'Agent Health Summary',
    'Target Status Summary',
  ],
  audit_vault: [
    'Repository Size',
    'Audit Data Growth',
    'Archive Status',
  ],
  firewall: [
    'Policy Review',
    'Rule Effectiveness',
  ],
};

const STORAGE_KEY_DAILY = 'checkTypes_daily';
const STORAGE_KEY_WEEKLY = 'checkTypes_weekly';

const CheckTypesContext = createContext<CheckTypesContextType | undefined>(undefined);

export const CheckTypesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dailyCheckTypes, setDailyCheckTypes] = useState<Record<string, string[]>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DAILY);
    return stored ? JSON.parse(stored) : defaultDailyCheckTypes;
  });

  const [weeklyCheckTypes, setWeeklyCheckTypes] = useState<Record<string, string[]>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_WEEKLY);
    return stored ? JSON.parse(stored) : defaultWeeklyCheckTypes;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(dailyCheckTypes));
  }, [dailyCheckTypes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(weeklyCheckTypes));
  }, [weeklyCheckTypes]);

  const addDailyCheck = (categoryId: string, checkName: string) => {
    if (!checkName.trim()) return;
    setDailyCheckTypes(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), checkName.trim()],
    }));
  };

  const removeDailyCheck = (categoryId: string, checkName: string) => {
    setDailyCheckTypes(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter(c => c !== checkName),
    }));
  };

  const addWeeklyCheck = (categoryId: string, checkName: string) => {
    if (!checkName.trim()) return;
    setWeeklyCheckTypes(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), checkName.trim()],
    }));
  };

  const removeWeeklyCheck = (categoryId: string, checkName: string) => {
    setWeeklyCheckTypes(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter(c => c !== checkName),
    }));
  };

  const getCategoryForDatabaseType = (dbType: string): string => {
    const category = defaultCategories.find(cat => cat.databaseTypes.includes(dbType));
    return category?.id || 'standard';
  };

  const getDailyChecksForDatabaseType = (type: string): string[] => {
    const categoryId = getCategoryForDatabaseType(type);
    return dailyCheckTypes[categoryId] || [];
  };

  const getWeeklyChecksForDatabaseType = (type: string): string[] => {
    const categoryId = getCategoryForDatabaseType(type);
    return weeklyCheckTypes[categoryId] || [];
  };

  const resetToDefaults = () => {
    setDailyCheckTypes(defaultDailyCheckTypes);
    setWeeklyCheckTypes(defaultWeeklyCheckTypes);
  };

  return (
    <CheckTypesContext.Provider
      value={{
        dailyCheckTypes,
        weeklyCheckTypes,
        categories: defaultCategories,
        addDailyCheck,
        removeDailyCheck,
        addWeeklyCheck,
        removeWeeklyCheck,
        getDailyChecksForDatabaseType,
        getWeeklyChecksForDatabaseType,
        resetToDefaults,
      }}
    >
      {children}
    </CheckTypesContext.Provider>
  );
};

export const useCheckTypes = () => {
  const context = useContext(CheckTypesContext);
  if (!context) {
    throw new Error('useCheckTypes must be used within a CheckTypesProvider');
  }
  return context;
};
