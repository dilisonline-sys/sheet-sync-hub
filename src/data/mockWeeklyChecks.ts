import { WeeklyCheck, TablespaceInfo, TablespaceUsageData } from '@/types';

const generateTablespaces = (prefix: string): TablespaceInfo[] => {
  const tablespaces = [
    { name: 'APPUSER', baseTotal: 65, baseUsedPercent: 80 },
    { name: 'AUDTBS', baseTotal: 1, baseUsedPercent: 0 },
    { name: 'AVL_DATA', baseTotal: 66, baseUsedPercent: 55 },
    { name: 'GG_DATA', baseTotal: 0.2, baseUsedPercent: 4 },
    { name: 'INDEXTS', baseTotal: 110, baseUsedPercent: 77 },
    { name: 'OPRUSERTS', baseTotal: 16, baseUsedPercent: 0 },
    { name: 'INTEGRATIONTS', baseTotal: 35, baseUsedPercent: 57 },
    { name: 'SYSAUX', baseTotal: 80, baseUsedPercent: 72 },
    { name: 'SYSTEM', baseTotal: 152, baseUsedPercent: 82 },
    { name: 'TEMP', baseTotal: 64, baseUsedPercent: 20 },
    { name: 'UNDOTBS1', baseTotal: 10, baseUsedPercent: 5 },
    { name: 'UNDOTBS2', baseTotal: 7, baseUsedPercent: 5 },
    { name: 'USERS', baseTotal: 5, baseUsedPercent: 0 },
  ];

  return tablespaces.map(ts => {
    const variation = (Math.random() - 0.5) * 10;
    const usedPercent = Math.min(100, Math.max(0, ts.baseUsedPercent + variation));
    const usedGB = (ts.baseTotal * usedPercent) / 100;
    const freeGB = ts.baseTotal - usedGB;
    
    return {
      name: ts.name,
      totalGB: ts.baseTotal,
      usedGB: Math.round(usedGB * 100) / 100,
      freeGB: Math.round(freeGB * 100) / 100,
      usedPercent: Math.round(usedPercent),
    };
  });
};

export const mockWeeklyChecks: WeeklyCheck[] = [
  {
    id: 'week1-cprdb',
    weekNumber: 1,
    weekStartDate: new Date('2025-12-03'),
    databaseId: 'cprdb',
    productionDbSize: '612 GB',
    schemaSize: {
      'Production DPCCC': '89 GB',
    },
    invalidObjects: 99,
    instanceStartDate: '23-Feb-2024 09:49:11',
    tablespaces: generateTablespaces('CPRDB'),
    objectsCreated: [
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'KPI Management', comment: 'Marco Created table in Production database' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'Protocol of Mapping', comment: 'Marco Created table in Production database' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'Eventtype Mapping', comment: 'Marco Created table in Production database' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'Area Mapping', comment: 'Marco Created table in Production database' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'KPI Management Definition', comment: 'Marco Created table in Production database' },
    ],
  },
  {
    id: 'week1-cpadb',
    weekNumber: 1,
    weekStartDate: new Date('2025-12-03'),
    databaseId: 'cpadb',
    archiveDbSize: '1252 GB',
    schemaSize: {
      'Archive DPCCC': '279 GB',
      'ARCDPCCC': '10 GB',
      'AVL_DATA': '172 GB',
      'REPORTING_APP': '29.62 GB',
      'HIPATH': '128.3 GB',
      'HIPATH_CP': '16.39 GB',
    },
    invalidObjects: 327,
    instanceStartDate: '28-OCT-2024 14:26:03',
    tablespaces: generateTablespaces('ARCDB'),
    objectsCreated: [
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'KPI Management', comment: 'Replicate table Created by Golden gate' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'Protocol of Mapping', comment: 'Replicate table Created by Golden gate' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'Eventtype Mapping', comment: 'Replicate table Created by Golden gate' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'Area Mapping', comment: 'Replicate table Created by Golden gate' },
      { date: new Date('2025-12-02'), userName: 'DPCCC', objectName: 'KPI Management Definition', comment: 'Replicate table Created by Golden gate' },
    ],
  },
  {
    id: 'week1-cpsdb',
    weekNumber: 1,
    weekStartDate: new Date('2025-12-03'),
    databaseId: 'cpsdb',
    instanceStartDate: '24-Feb-2024 15:01:14',
    tablespaces: generateTablespaces('CPSDB'),
  },
  {
    id: 'week1-oemdb',
    weekNumber: 1,
    weekStartDate: new Date('2025-12-03'),
    databaseId: 'oemdb',
    instanceStartDate: '05-SEP-2024 10:37:04',
  },
];

export const getWeeklyChecksByDatabase = (databaseId: string): WeeklyCheck[] => {
  return mockWeeklyChecks.filter(check => check.databaseId === databaseId);
};

export const getTablespaceUsageData = (tablespaces: TablespaceInfo[]): TablespaceUsageData[] => {
  return tablespaces
    .filter(ts => ts.totalGB > 1)
    .slice(0, 10)
    .map(ts => ({
      name: ts.name,
      used: ts.usedGB,
      free: ts.freeGB,
      total: ts.totalGB,
    }));
};
