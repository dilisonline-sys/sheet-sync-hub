import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChecks } from '@/contexts/ChecksContext';
import { mockDatabases } from '@/data/mockDatabases';
import { format } from 'date-fns';
import { CalendarIcon, Printer, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const DailyReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDatabase = searchParams.get('database') || 'all';
  
  const [selectedDatabase, setSelectedDatabase] = useState<string>(initialDatabase);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { dailyChecksByDatabase } = useChecks();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <MinusCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Pass</Badge>;
      case 'fail': return <Badge variant="destructive">Fail</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
      default: return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  const databasesToShow = selectedDatabase === 'all' 
    ? mockDatabases 
    : mockDatabases.filter(db => db.id === selectedDatabase);

  const dateString = selectedDate.toDateString();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Controls - hidden on print */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Report</h1>
            <p className="text-muted-foreground">Detailed check results for {format(selectedDate, 'MMMM d, yyyy')}</p>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print:p-0">
          {/* Print Header */}
          <div className="hidden print:block mb-8">
            <h1 className="text-2xl font-bold text-center">Daily Database Health Report</h1>
            <p className="text-center text-muted-foreground">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-center text-sm text-muted-foreground mt-1">Generated on {format(new Date(), 'PPP p')}</p>
          </div>

          {/* Report Content */}
          {databasesToShow.map(db => {
            const checks = dailyChecksByDatabase[db.id] || [];
            const dayChecks = checks.find(c => new Date(c.date).toDateString() === dateString);
            
            const stats = dayChecks?.checks.reduce(
              (acc, check) => {
                if (check.status === 'pass') acc.passed++;
                else if (check.status === 'fail') acc.failed++;
                else if (check.status === 'warning') acc.warnings++;
                return acc;
              },
              { passed: 0, failed: 0, warnings: 0 }
            ) || { passed: 0, failed: 0, warnings: 0 };

            return (
              <Card key={db.id} className="mb-6 print:mb-4 print:break-inside-avoid print:shadow-none print:border">
                <CardHeader className="print:pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{db.databaseName}</CardTitle>
                      <CardDescription>{db.instanceName} | {db.type.replace('_', ' ').toUpperCase()}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>{stats.passed} Pass</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span>{stats.warnings} Warn</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-destructive" />
                        <span>{stats.failed} Fail</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dayChecks ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">Status</TableHead>
                          <TableHead>Check Name</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayChecks.checks.map((check, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{getStatusIcon(check.status)}</TableCell>
                            <TableCell className="font-medium">{check.name}</TableCell>
                            <TableCell>{getStatusBadge(check.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {check.details || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No checks recorded for this date</p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>DB Monitor - DPCCC | Page 1</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DailyReport;
