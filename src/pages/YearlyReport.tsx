import React, { useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useChecks } from '@/contexts/ChecksContext';
import { mockDatabases } from '@/data/mockDatabases';
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth, isSameYear } from 'date-fns';
import { Printer, CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const YearlyReport: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const [selectedDatabase, setSelectedDatabase] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { dailyChecksByDatabase, weeklyChecks } = useChecks();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const years = [currentYear - 2, currentYear - 1, currentYear];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const selectedDate = new Date(selectedYear, 0, 1);
  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);
  const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const databasesToShow = selectedDatabase === 'all' 
    ? mockDatabases 
    : mockDatabases.filter(db => db.id === selectedDatabase);

  const calculateYearStats = (databaseId: string) => {
    const checks = dailyChecksByDatabase[databaseId] || [];
    const yearChecks = checks.filter(c => isSameYear(new Date(c.date), selectedDate));
    
    let totalPassed = 0, totalFailed = 0, totalWarnings = 0, totalChecks = 0;
    const monthlyStats: Record<number, { passed: number; failed: number; warnings: number; total: number }> = {};
    
    // Initialize monthly stats
    for (let i = 0; i < 12; i++) {
      monthlyStats[i] = { passed: 0, failed: 0, warnings: 0, total: 0 };
    }
    
    yearChecks.forEach(day => {
      const month = new Date(day.date).getMonth();
      
      day.checks.forEach(check => {
        totalChecks++;
        monthlyStats[month].total++;
        if (check.status === 'pass') { totalPassed++; monthlyStats[month].passed++; }
        if (check.status === 'fail') { totalFailed++; monthlyStats[month].failed++; }
        if (check.status === 'warning') { totalWarnings++; monthlyStats[month].warnings++; }
      });
    });

    return { totalPassed, totalFailed, totalWarnings, totalChecks, monthlyStats };
  };

  // Calculate overall stats
  const overallStats = databasesToShow.reduce(
    (acc, db) => {
      const stats = calculateYearStats(db.id);
      acc.passed += stats.totalPassed;
      acc.failed += stats.totalFailed;
      acc.warnings += stats.totalWarnings;
      acc.total += stats.totalChecks;
      return acc;
    },
    { passed: 0, failed: 0, warnings: 0, total: 0 }
  );

  const overallPassRate = overallStats.total > 0 
    ? ((overallStats.passed / overallStats.total) * 100).toFixed(1) 
    : '0';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Yearly Report</h1>
            <p className="text-muted-foreground">{selectedYear} Annual Summary</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select database" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Databases</SelectItem>
                {mockDatabases.map(db => (
                  <SelectItem key={db.id} value={db.id}>{db.shortName} - {db.instanceName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print:p-0">
          {/* Print Header */}
          <div className="hidden print:block mb-8">
            <h1 className="text-2xl font-bold text-center">Annual Database Health Report</h1>
            <p className="text-center text-muted-foreground">{selectedYear}</p>
            <p className="text-center text-sm text-muted-foreground mt-1">Generated on {format(new Date(), 'PPP p')}</p>
          </div>

          {/* Overall Summary */}
          <Card className="mb-6 print:shadow-none">
            <CardHeader>
              <CardTitle>Annual Summary</CardTitle>
              <CardDescription>Overall performance for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Checks</p>
                  <p className="text-3xl font-bold">{overallStats.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-3xl font-bold text-green-500">{overallPassRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Passed
                  </p>
                  <p className="text-3xl font-bold text-green-500">{overallStats.passed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" /> Warnings
                  </p>
                  <p className="text-3xl font-bold text-yellow-500">{overallStats.warnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-destructive" /> Failed
                  </p>
                  <p className="text-3xl font-bold text-destructive">{overallStats.failed.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Overview */}
          <Card className="mb-6 print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Pass rates by month across all selected databases</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Passed</TableHead>
                    <TableHead className="text-right">Warnings</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="w-[200px]">Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthsInYear.map((month, idx) => {
                    const monthStats = databasesToShow.reduce(
                      (acc, db) => {
                        const stats = calculateYearStats(db.id);
                        const ms = stats.monthlyStats[idx];
                        acc.passed += ms.passed;
                        acc.failed += ms.failed;
                        acc.warnings += ms.warnings;
                        acc.total += ms.total;
                        return acc;
                      },
                      { passed: 0, failed: 0, warnings: 0, total: 0 }
                    );
                    const passRate = monthStats.total > 0 
                      ? ((monthStats.passed / monthStats.total) * 100)
                      : 0;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{format(month, 'MMMM')}</TableCell>
                        <TableCell className="text-right">{monthStats.total}</TableCell>
                        <TableCell className="text-right text-green-500">{monthStats.passed}</TableCell>
                        <TableCell className="text-right text-yellow-500">{monthStats.warnings}</TableCell>
                        <TableCell className="text-right text-destructive">{monthStats.failed}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={passRate} className="h-2" />
                            <span className="text-sm text-muted-foreground w-12">{passRate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Database Breakdown */}
          <Card className="print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Database Performance Summary</CardTitle>
              <CardDescription>Annual statistics by database</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Database</TableHead>
                    <TableHead>Instance</TableHead>
                    <TableHead className="text-right">Total Checks</TableHead>
                    <TableHead className="text-right">Passed</TableHead>
                    <TableHead className="text-right">Warnings</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-center">Pass Rate</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {databasesToShow.map(db => {
                    const stats = calculateYearStats(db.id);
                    const passRate = stats.totalChecks > 0 
                      ? ((stats.totalPassed / stats.totalChecks) * 100)
                      : 0;

                    return (
                      <TableRow key={db.id}>
                        <TableCell className="font-medium">{db.shortName}</TableCell>
                        <TableCell className="text-muted-foreground">{db.instanceName}</TableCell>
                        <TableCell className="text-right">{stats.totalChecks}</TableCell>
                        <TableCell className="text-right text-green-500">{stats.totalPassed}</TableCell>
                        <TableCell className="text-right text-yellow-500">{stats.totalWarnings}</TableCell>
                        <TableCell className="text-right text-destructive">{stats.totalFailed}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={passRate >= 90 ? 'default' : passRate >= 70 ? 'secondary' : 'destructive'}>
                            {passRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {passRate >= 90 ? (
                            <div className="flex items-center justify-center gap-1 text-green-500">
                              <TrendingUp className="w-4 h-4" /> Healthy
                            </div>
                          ) : passRate >= 70 ? (
                            <div className="flex items-center justify-center gap-1 text-yellow-500">
                              <AlertTriangle className="w-4 h-4" /> Warning
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-destructive">
                              <TrendingDown className="w-4 h-4" /> Critical
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>DB Monitor - DPCCC | Annual Report - {selectedYear}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default YearlyReport;
