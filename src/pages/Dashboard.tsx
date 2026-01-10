import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChecks } from '@/contexts/ChecksContext';
import { useDatabases } from '@/contexts/DatabaseContext';
import { useCheckTypes } from '@/contexts/CheckTypesContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateTrendData } from '@/data/mockDailyChecks';
import { getTablespaceUsageData } from '@/data/mockWeeklyChecks';
import { CheckStatus, DailyCheckSummary } from '@/types';
import DailyChecksTable from '@/components/dashboard/DailyChecksTable';
import WeeklyChecksCard from '@/components/dashboard/WeeklyChecksCard';
import ChecksTrendChart from '@/components/dashboard/ChecksTrendChart';
import TablespaceChart from '@/components/dashboard/TablespaceChart';
import DatabaseHealthCard from '@/components/dashboard/DatabaseHealthCard';
import { 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const { dailyChecksByDatabase, weeklyChecks } = useChecks();
  const { databases } = useDatabases();
  const { getDailyChecksForDatabase } = useCheckTypes();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Calculate stats
  const totalDatabases = databases.length;
  const trendData = generateTrendData(30);
  
  // Calculate health status for each database from the databases context
  const databaseHealth = databases.map((db) => {
    const checks = dailyChecksByDatabase[db.id] || [];
    const latestCheck = checks[0];
    const failedCount = latestCheck?.checks.filter(c => c.status === 'fail').length || 0;
    const warningCount = latestCheck?.checks.filter(c => c.status === 'warning').length || 0;
    const configuredChecks = getDailyChecksForDatabase(db.id);
    
    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (failedCount > 0) health = 'critical';
    else if (warningCount > 2) health = 'warning';
    
    return {
      dbId: db.id,
      dbName: db.shortName,
      fullName: db.databaseName,
      health,
      failedCount,
      warningCount,
      passedCount: (latestCheck?.checks.length || 0) - failedCount - warningCount,
      type: db.type,
      configuredChecks: configuredChecks.length,
    };
  });

  const healthyCount = databaseHealth.filter(d => d.health === 'healthy').length;
  const warningCount = databaseHealth.filter(d => d.health === 'warning').length;
  const criticalCount = databaseHealth.filter(d => d.health === 'critical').length;

  // Get tablespace data for CPRDB
  const cprdbWeekly = weeklyChecks.find(w => w.databaseId === 'cprdb');
  const tablespaceData = cprdbWeekly?.tablespaces 
    ? getTablespaceUsageData(cprdbWeekly.tablespaces) 
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Database monitoring overview for DPCCC</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDatabases}</p>
                  <p className="text-sm text-muted-foreground">Total Databases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{healthyCount}</p>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{warningCount}</p>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <Server className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                  <p className="text-sm text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Health Grid */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Database Health Status
            </CardTitle>
            <CardDescription>Current status of all monitored databases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {databaseHealth.map((db) => (
                <DatabaseHealthCard key={db.dbId} {...db} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChecksTrendChart data={trendData} />
          <TablespaceChart data={tablespaceData} />
        </div>

        {/* Detailed Checks Tabs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Database Checks
            </CardTitle>
            <CardDescription>Daily and weekly checks grouped by database</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily Checks</TabsTrigger>
                <TabsTrigger value="weekly">Weekly Checks</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-6">
                {databases.map((db) => {
                  const checks = dailyChecksByDatabase[db.id] || [];
                  if (checks.length === 0) return null;
                  return (
                    <DailyChecksTable 
                      key={db.id}
                      databaseName={db.shortName}
                      fullName={db.databaseName}
                      checks={checks.slice(0, 7)}
                    />
                  );
                })}
              </TabsContent>

              <TabsContent value="weekly" className="space-y-6">
                {weeklyChecks.map((weeklyCheck) => {
                  const db = databases.find(d => d.id === weeklyCheck.databaseId);
                  return (
                    <WeeklyChecksCard
                      key={weeklyCheck.id}
                      databaseName={db?.shortName || weeklyCheck.databaseId}
                      fullName={db?.databaseName || weeklyCheck.databaseId}
                      weeklyCheck={weeklyCheck}
                    />
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
