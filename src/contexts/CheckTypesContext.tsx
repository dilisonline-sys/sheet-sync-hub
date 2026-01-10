import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CheckTypeCategory {
  id: string;
  name: string;
  description: string;
  databaseTypes: string[];
}

export interface CheckTypesContextType {
  dailyCheckTypes: Record<string, string[]>; // databaseId -> checks
  weeklyCheckTypes: Record<string, string[]>;
  categories: CheckTypeCategory[];
  addDailyCheck: (databaseId: string, checkName: string) => void;
  removeDailyCheck: (databaseId: string, checkName: string) => void;
  addWeeklyCheck: (databaseId: string, checkName: string) => void;
  removeWeeklyCheck: (databaseId: string, checkName: string) => void;
  getDailyChecksForDatabase: (databaseId: string) => string[];
  getWeeklyChecksForDatabase: (databaseId: string) => string[];
  initializeChecksForDatabase: (databaseId: string, dbType: string) => void;
  resetToDefaults: () => void;
}

const defaultCategories: CheckTypeCategory[] = [
  { id: 'standard', name: 'Standard Databases', description: 'Primary, Standby, Archive, GIS, Pilot databases', databaseTypes: ['primary', 'standby', 'archive', 'gis', 'pilot'] },
  { id: 'oem', name: 'OEM', description: 'Oracle Enterprise Manager', databaseTypes: ['oem'] },
  { id: 'audit_vault', name: 'Audit Vault', description: 'Oracle Audit Vault', databaseTypes: ['audit_vault'] },
  { id: 'firewall', name: 'Firewall', description: 'Database Firewall', databaseTypes: ['firewall'] },
];

// Default checks by category (used as templates for new databases)
const defaultDailyChecksByCategory: Record<string, string[]> = {
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

const defaultWeeklyChecksByCategory: Record<string, string[]> = {
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

// Initial database IDs from mockDatabases
const initialDatabaseIds = ['cprdb', 'cprdb2', 'cpsdb', 'cpadb', 'cpgdb', 'oemdb', 'avs', 'dbfw'];
const databaseTypeMap: Record<string, string> = {
  cprdb: 'primary', cprdb2: 'primary', cpsdb: 'standby', cpadb: 'archive',
  cpgdb: 'gis', oemdb: 'oem', avs: 'audit_vault', dbfw: 'firewall',
};

const getCategoryForType = (dbType: string): string => {
  const category = defaultCategories.find(cat => cat.databaseTypes.includes(dbType));
  return category?.id || 'standard';
};

const generateInitialChecks = (): Record<string, string[]> => {
  const checks: Record<string, string[]> = {};
  initialDatabaseIds.forEach(dbId => {
    const dbType = databaseTypeMap[dbId] || 'primary';
    const categoryId = getCategoryForType(dbType);
    checks[dbId] = [...(defaultDailyChecksByCategory[categoryId] || defaultDailyChecksByCategory.standard)];
  });
  return checks;
};

const generateInitialWeeklyChecks = (): Record<string, string[]> => {
  const checks: Record<string, string[]> = {};
  initialDatabaseIds.forEach(dbId => {
    const dbType = databaseTypeMap[dbId] || 'primary';
    const categoryId = getCategoryForType(dbType);
    checks[dbId] = [...(defaultWeeklyChecksByCategory[categoryId] || defaultWeeklyChecksByCategory.standard)];
  });
  return checks;
};

const STORAGE_KEY_DAILY = 'checkTypes_daily_v2';
const STORAGE_KEY_WEEKLY = 'checkTypes_weekly_v2';

const CheckTypesContext = createContext<CheckTypesContextType | undefined>(undefined);

export const CheckTypesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dailyCheckTypes, setDailyCheckTypes] = useState<Record<string, string[]>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DAILY);
    return stored ? JSON.parse(stored) : generateInitialChecks();
  });

  const [weeklyCheckTypes, setWeeklyCheckTypes] = useState<Record<string, string[]>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_WEEKLY);
    return stored ? JSON.parse(stored) : generateInitialWeeklyChecks();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(dailyCheckTypes));
  }, [dailyCheckTypes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(weeklyCheckTypes));
  }, [weeklyCheckTypes]);

  const addDailyCheck = (databaseId: string, checkName: string) => {
    if (!checkName.trim()) return;
    setDailyCheckTypes(prev => ({
      ...prev,
      [databaseId]: [...(prev[databaseId] || []), checkName.trim()],
    }));
  };

  const removeDailyCheck = (databaseId: string, checkName: string) => {
    setDailyCheckTypes(prev => ({
      ...prev,
      [databaseId]: (prev[databaseId] || []).filter(c => c !== checkName),
    }));
  };

  const addWeeklyCheck = (databaseId: string, checkName: string) => {
    if (!checkName.trim()) return;
    setWeeklyCheckTypes(prev => ({
      ...prev,
      [databaseId]: [...(prev[databaseId] || []), checkName.trim()],
    }));
  };

  const removeWeeklyCheck = (databaseId: string, checkName: string) => {
    setWeeklyCheckTypes(prev => ({
      ...prev,
      [databaseId]: (prev[databaseId] || []).filter(c => c !== checkName),
    }));
  };

  const getDailyChecksForDatabase = (databaseId: string): string[] => {
    return dailyCheckTypes[databaseId] || [];
  };

  const getWeeklyChecksForDatabase = (databaseId: string): string[] => {
    return weeklyCheckTypes[databaseId] || [];
  };

  const initializeChecksForDatabase = (databaseId: string, dbType: string) => {
    const categoryId = getCategoryForType(dbType);
    setDailyCheckTypes(prev => ({
      ...prev,
      [databaseId]: [...(defaultDailyChecksByCategory[categoryId] || defaultDailyChecksByCategory.standard)],
    }));
    setWeeklyCheckTypes(prev => ({
      ...prev,
      [databaseId]: [...(defaultWeeklyChecksByCategory[categoryId] || defaultWeeklyChecksByCategory.standard)],
    }));
  };

  const resetToDefaults = () => {
    setDailyCheckTypes(generateInitialChecks());
    setWeeklyCheckTypes(generateInitialWeeklyChecks());
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
        getDailyChecksForDatabase,
        getWeeklyChecksForDatabase,
        initializeChecksForDatabase,
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
