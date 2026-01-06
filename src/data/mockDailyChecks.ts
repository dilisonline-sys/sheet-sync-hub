import { DailyCheckSummary, CheckStatus, CheckTrendData } from '@/types';

const generateRandomStatus = (): CheckStatus => {
  const rand = Math.random();
  if (rand > 0.15) return 'pass';
  if (rand > 0.05) return 'warning';
  return 'fail';
};

const dailyCheckTypes = [
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
];

const oemCheckTypes = [
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
];

const auditVaultCheckTypes = [
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
];

const firewallCheckTypes = [
  'Instance Availability',
  'Firewall Policies Active',
  'Blocking Rules Validation',
  'Alerting Rules Validation',
];

export const generateDailyChecksForDatabase = (
  databaseId: string,
  databaseName: string,
  instanceName: string,
  type: string,
  days: number = 31
): DailyCheckSummary[] => {
  const checks: DailyCheckSummary[] = [];
  const today = new Date();
  
  let checkTypes = dailyCheckTypes;
  if (type === 'oem') checkTypes = oemCheckTypes;
  if (type === 'audit_vault') checkTypes = auditVaultCheckTypes;
  if (type === 'firewall') checkTypes = firewallCheckTypes;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    checks.push({
      date,
      databaseName,
      instanceName,
      checks: checkTypes.map(name => ({
        name,
        status: generateRandomStatus(),
        details: generateRandomStatus() === 'fail' ? 'Needs investigation' : undefined,
      })),
    });
  }

  return checks;
};

export const generateTrendData = (days: number = 30): CheckTrendData[] => {
  const data: CheckTrendData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const total = 100;
    const failed = Math.floor(Math.random() * 8);
    const warnings = Math.floor(Math.random() * 12);
    const passed = total - failed - warnings;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      passed,
      failed,
      warnings,
    });
  }

  return data;
};

// Pre-generated mock data for all databases
export const mockDailyChecksByDatabase: Record<string, DailyCheckSummary[]> = {
  cprdb: generateDailyChecksForDatabase('cprdb', 'Control Pro Prod', 'CPRDB', 'primary'),
  cpsdb: generateDailyChecksForDatabase('cpsdb', 'Control Pro Stdby', 'CPSDB', 'standby'),
  cpadb: generateDailyChecksForDatabase('cpadb', 'Control Pro Archive', 'CPADB', 'archive'),
  cpgdb: generateDailyChecksForDatabase('cpgdb', 'GIS Database', 'CPGDB', 'gis'),
  oemdb: generateDailyChecksForDatabase('oemdb', 'OEM DB', 'OEMDB', 'oem'),
  avs: generateDailyChecksForDatabase('avs', 'Audit Vault Server', 'AVS', 'audit_vault'),
  dbfw: generateDailyChecksForDatabase('dbfw', 'Database Firewall', 'DBFW', 'firewall'),
};
