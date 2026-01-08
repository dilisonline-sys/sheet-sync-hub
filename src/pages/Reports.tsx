import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChecks } from '@/contexts/ChecksContext';
import { mockDatabases } from '@/data/mockDatabases';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, TrendingUp, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

const Reports: React.FC = () => {
  const { dailyChecksByDatabase, weeklyChecks } = useChecks();
  const today = new Date();

  // Calculate summary stats
  const calculateDatabaseStats = (databaseId: string) => {
    const checks = dailyChecksByDatabase[databaseId] || [];
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;
    let totalChecks = 0;

    checks.forEach(day => {
      day.checks.forEach(check => {
        totalChecks++;
        if (check.status === 'pass') totalPassed++;
        if (check.status === 'fail') totalFailed++;
        if (check.status === 'warning') totalWarnings++;
      });
    });

    return { totalPassed, totalFailed, totalWarnings, totalChecks };
  };

  const overallStats = mockDatabases.reduce(
    (acc, db) => {
      const stats = calculateDatabaseStats(db.id);
      acc.passed += stats.totalPassed;
      acc.failed += stats.totalFailed;
      acc.warnings += stats.totalWarnings;
      acc.total += stats.totalChecks;
      return acc;
    },
    { passed: 0, failed: 0, warnings: 0, total: 0 }
  );

  const passRate = overallStats.total > 0 
    ? ((overallStats.passed / overallStats.total) * 100).toFixed(1) 
    : '0';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate printable reports for database health monitoring</p>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Checks</CardDescription>
              <CardTitle className="text-2xl">{overallStats.total.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Passed
              </CardDescription>
              <CardTitle className="text-2xl text-green-500">{overallStats.passed.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> Warnings
              </CardDescription>
              <CardTitle className="text-2xl text-yellow-500">{overallStats.warnings.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-destructive" /> Failed
              </CardDescription>
              <CardTitle className="text-2xl text-destructive">{overallStats.failed.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Report */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Daily Report</CardTitle>
                  <CardDescription>Detailed check results for each day</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                View detailed database check results for any specific day. Includes all check types, statuses, and comments.
              </p>
              <Button asChild className="w-full">
                <Link to="/reports/daily">
                  View Daily Reports <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Report */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <FileText className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <CardTitle>Monthly Report</CardTitle>
                  <CardDescription>Monthly summary and trends</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Monthly aggregated view with day-by-day breakdown, pass rates, and issue summaries per database.
              </p>
              <Button asChild className="w-full">
                <Link to="/reports/monthly">
                  View Monthly Reports <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Yearly Report */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <CardTitle>Yearly Report</CardTitle>
                  <CardDescription>Annual overview and statistics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Year-long performance analysis with monthly trends, annual statistics, and comparative metrics.
              </p>
              <Button asChild className="w-full">
                <Link to="/reports/yearly">
                  View Yearly Reports <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Database Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access by Database</CardTitle>
            <CardDescription>Jump directly to reports for a specific database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mockDatabases.map(db => {
                const stats = calculateDatabaseStats(db.id);
                const passRate = stats.totalChecks > 0 
                  ? ((stats.totalPassed / stats.totalChecks) * 100).toFixed(0) 
                  : '0';
                
                return (
                  <Link 
                    key={db.id} 
                    to={`/reports/daily?database=${db.id}`}
                    className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
                  >
                    <div className="font-medium text-sm">{db.shortName}</div>
                    <div className="text-xs text-muted-foreground">{db.instanceName}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={parseInt(passRate) >= 90 ? 'default' : parseInt(passRate) >= 70 ? 'secondary' : 'destructive'}>
                        {passRate}% pass
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
