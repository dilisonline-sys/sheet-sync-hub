// User Management Types
export type UserRole = 'admin' | 'user';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  createdAt: Date;
  lastLogin?: Date;
}

// Database Infrastructure Types
export interface DatabaseInstance {
  id: string;
  databaseName: string;
  shortName: string;
  instanceName: string;
  ipAddress: string;
  hostName: string;
  vCPU: number;
  ram: string;
  sga?: string;
  softwareVersion: string;
  osVersion: string;
  type: 'primary' | 'standby' | 'archive' | 'gis' | 'oem' | 'pilot' | 'audit_vault' | 'firewall';
}

// Daily Check Types
export type CheckStatus = 'pass' | 'fail' | 'warning' | 'not_checked';

export interface DailyCheck {
  id: string;
  databaseId: string;
  instanceName: string;
  checkName: string;
  checkDate: Date;
  status: CheckStatus;
  value?: string;
  comments?: string;
}

export interface DailyCheckSummary {
  date: Date;
  databaseName: string;
  instanceName: string;
  checks: {
    name: string;
    status: CheckStatus;
    details?: string;
  }[];
}

// Weekly Check Types
export interface TablespaceInfo {
  name: string;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usedPercent: number;
}

export interface WeeklyCheck {
  id: string;
  weekNumber: number;
  weekStartDate: Date;
  databaseId: string;
  productionDbSize?: string;
  archiveDbSize?: string;
  schemaSize?: Record<string, string>;
  invalidObjects?: number;
  instanceStartDate?: string;
  tablespaces?: TablespaceInfo[];
  objectsCreated?: ObjectCreated[];
}

export interface ObjectCreated {
  date: Date;
  userName: string;
  objectName: string;
  comment: string;
}

// Dashboard Types
export interface DatabaseCheckGroup {
  databaseId: string;
  databaseName: string;
  instanceName: string;
  type: string;
  dailyChecks: DailyCheckSummary[];
  weeklyChecks: WeeklyCheck[];
  overallHealth: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
}

// Chart Data Types
export interface CheckTrendData {
  date: string;
  passed: number;
  failed: number;
  warnings: number;
}

export interface TablespaceUsageData {
  name: string;
  used: number;
  free: number;
  total: number;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
