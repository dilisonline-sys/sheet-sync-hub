import React, { useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChecks } from '@/contexts/ChecksContext';
import { mockDatabases } from '@/data/mockDatabases';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { Printer, CheckCircle2, XCircle, AlertTriangle, Calendar } from 'lucide-react';

const MonthlyReport: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedDatabase, setSelectedDatabase] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const { dailyChecksByDatabase } = useChecks();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [currentYear - 2, currentYear - 1, currentYear];

  const selectedDate = new Date(selectedYear, selectedMonth, 1);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const databasesToShow = selectedDatabase === 'all' 
    ? mockDatabases 
    : mockDatabases.filter(db => db.id === selectedDatabase);

  const calculateMonthStats = (databaseId: string) => {
    const checks = dailyChecksByDatabase[databaseId] || [];
    const monthChecks = checks.filter(c => isSameMonth(new Date(c.date), selectedDate));
    
    let totalPassed = 0, totalFailed = 0, totalWarnings = 0, totalChecks = 0;
    const dailyStats: Record<string, { passed: number; failed: number; warnings: number }> = {};
    
    monthChecks.forEach(day => {
      const dateKey = format(new Date(day.date), 'yyyy-MM-dd');
      dailyStats[dateKey] = { passed: 0, failed: 0, warnings: 0 };
      
      day.checks.forEach(check => {
        totalChecks++;
        if (check.status === 'pass') { totalPassed++; dailyStats[dateKey].passed++; }
        if (check.status === 'fail') { totalFailed++; dailyStats[dateKey].failed++; }
        if (check.status === 'warning') { totalWarnings++; dailyStats[dateKey].warnings++; }
      });
    });

    return { totalPassed, totalFailed, totalWarnings, totalChecks, dailyStats, daysWithData: monthChecks.length };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monthly Report</h1>
            <p className="text-muted-foreground">{months[selectedMonth]} {selectedYear} Summary</p>
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
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, idx) => (
                  <SelectItem key={month} value={idx.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
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
            <h1 className="text-2xl font-bold text-center">Monthly Database Health Report</h1>
            <p className="text-center text-muted-foreground">{months[selectedMonth]} {selectedYear}</p>
            <p className="text-center text-sm text-muted-foreground mt-1">Generated on {format(new Date(), 'PPP p')}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:grid-cols-4">
            {(() => {
              const totals = databasesToShow.reduce(
                (acc, db) => {
                  const stats = calculateMonthStats(db.id);
                  acc.passed += stats.totalPassed;
                  acc.failed += stats.totalFailed;
                  acc.warnings += stats.totalWarnings;
                  acc.total += stats.totalChecks;
                  return acc;
                },
                { passed: 0, failed: 0, warnings: 0, total: 0 }
              );
              const passRate = totals.total > 0 ? ((totals.passed / totals.total) * 100).toFixed(1) : '0';
              
              return (
                <>
                  <Card className="print:shadow-none">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Checks</CardDescription>
                      <CardTitle className="text-2xl">{totals.total.toLocaleString()}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="print:shadow-none">
                    <CardHeader className="pb-2">
                      <CardDescription>Pass Rate</CardDescription>
                      <CardTitle className="text-2xl text-green-500">{passRate}%</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="print:shadow-none">
                    <CardHeader className="pb-2">
                      <CardDescription>Warnings</CardDescription>
                      <CardTitle className="text-2xl text-yellow-500">{totals.warnings}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="print:shadow-none">
                    <CardHeader className="pb-2">
                      <CardDescription>Failures</CardDescription>
                      <CardTitle className="text-2xl text-destructive">{totals.failed}</CardTitle>
                    </CardHeader>
                  </Card>
                </>
              );
            })()}
          </div>

          {/* Database Details */}
          {databasesToShow.map(db => {
            const stats = calculateMonthStats(db.id);
            const passRate = stats.totalChecks > 0 
              ? ((stats.totalPassed / stats.totalChecks) * 100).toFixed(1) 
              : '0';

            return (
              <Card key={db.id} className="mb-6 print:mb-4 print:break-inside-avoid print:shadow-none">
                <CardHeader className="print:pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{db.databaseName}</CardTitle>
                      <CardDescription>{db.instanceName} | {stats.daysWithData} days with data</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={parseFloat(passRate) >= 90 ? 'default' : parseFloat(passRate) >= 70 ? 'secondary' : 'destructive'}>
                        {passRate}% Pass Rate
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> Pass
                            </div>
                          </TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-yellow-500" /> Warn
                            </div>
                          </TableHead>
                          <TableHead className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <XCircle className="w-3 h-3 text-destructive" /> Fail
                            </div>
                          </TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {daysInMonth.map(day => {
                          const dateKey = format(day, 'yyyy-MM-dd');
                          const dayStats = stats.dailyStats[dateKey];
                          const hasData = !!dayStats;
                          
                          return (
                            <TableRow key={dateKey}>
                              <TableCell className="font-medium">
                                {format(day, 'EEE, MMM d')}
                              </TableCell>
                              <TableCell className="text-center text-green-500">
                                {hasData ? dayStats.passed : '-'}
                              </TableCell>
                              <TableCell className="text-center text-yellow-500">
                                {hasData ? dayStats.warnings : '-'}
                              </TableCell>
                              <TableCell className="text-center text-destructive">
                                {hasData ? dayStats.failed : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {hasData ? (
                                  dayStats.failed > 0 ? (
                                    <Badge variant="destructive">Issues</Badge>
                                  ) : dayStats.warnings > 0 ? (
                                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warnings</Badge>
                                  ) : (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>
                                  )
                                ) : (
                                  <Badge variant="outline">No Data</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>DB Monitor - DPCCC | Monthly Report - {months[selectedMonth]} {selectedYear}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MonthlyReport;
