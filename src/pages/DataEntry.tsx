import { useState } from 'react';
import { format, isToday, startOfDay } from 'date-fns';
import { CalendarIcon, Database, Save, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { mockDatabases } from '@/data/mockDatabases';
import { CheckStatus, TablespaceInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useChecks } from '@/contexts/ChecksContext';

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

const getCheckTypesForDatabase = (type: string) => {
  switch (type) {
    case 'oem':
      return oemCheckTypes;
    case 'audit_vault':
      return auditVaultCheckTypes;
    case 'firewall':
      return firewallCheckTypes;
    default:
      return dailyCheckTypes;
  }
};

const statusOptions: { value: CheckStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'pass', label: 'Pass', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-500' },
  { value: 'warning', label: 'Warning', icon: <AlertCircle className="h-4 w-4" />, color: 'text-amber-500' },
  { value: 'fail', label: 'Fail', icon: <XCircle className="h-4 w-4" />, color: 'text-red-500' },
  { value: 'not_checked', label: 'Not Checked', icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
];

export default function DataEntry() {
  const { toast } = useToast();
  const { saveDailyChecks, saveWeeklyChecks } = useChecks();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [dailyChecksState, setDailyChecksState] = useState<Record<string, CheckStatus>>({});
  const [dailyComments, setDailyComments] = useState<Record<string, string>>({});
  
  // Weekly check fields
  const [productionDbSize, setProductionDbSize] = useState('');
  const [archiveDbSize, setArchiveDbSize] = useState('');
  const [invalidObjects, setInvalidObjects] = useState('');
  const [instanceStartDate, setInstanceStartDate] = useState('');

  const selectedDb = mockDatabases.find(db => db.id === selectedDatabase);
  const checkTypes = selectedDb ? getCheckTypesForDatabase(selectedDb.type) : [];

  const handleDailyCheckChange = (checkName: string, status: CheckStatus) => {
    setDailyChecksState(prev => ({ ...prev, [checkName]: status }));
  };

  const handleCommentChange = (checkName: string, comment: string) => {
    setDailyComments(prev => ({ ...prev, [checkName]: comment }));
  };

  const handleSaveDailyChecks = () => {
    if (!selectedDatabase) {
      toast({
        title: "Error",
        description: "Please select a database first.",
        variant: "destructive",
      });
      return;
    }

    // Save to context (which persists to localStorage and updates dashboard)
    saveDailyChecks(selectedDatabase, selectedDate, dailyChecksState, dailyComments);

    toast({
      title: "Daily Checks Saved",
      description: `Successfully saved daily checks for ${selectedDb?.databaseName}. Dashboard has been updated.`,
    });

    // Reset form after saving
    setDailyChecksState({});
    setDailyComments({});
  };

  const handleSaveWeeklyChecks = () => {
    if (!selectedDatabase) {
      toast({
        title: "Error",
        description: "Please select a database first.",
        variant: "destructive",
      });
      return;
    }

    // Save to context (which persists to localStorage and updates dashboard)
    saveWeeklyChecks(selectedDatabase, selectedDate, {
      productionDbSize: productionDbSize || undefined,
      archiveDbSize: archiveDbSize || undefined,
      invalidObjects: invalidObjects ? parseInt(invalidObjects, 10) : undefined,
      instanceStartDate: instanceStartDate || undefined,
    });

    toast({
      title: "Weekly Checks Saved",
      description: `Successfully saved weekly checks for ${selectedDb?.databaseName}. Dashboard has been updated.`,
    });

    // Reset form after saving
    setProductionDbSize('');
    setArchiveDbSize('');
    setInvalidObjects('');
    setInstanceStartDate('');
  };

  const resetForm = () => {
    setDailyChecksState({});
    setDailyComments({});
    setProductionDbSize('');
    setArchiveDbSize('');
    setInvalidObjects('');
    setInstanceStartDate('');
  };

  const handleDatabaseChange = (value: string) => {
    setSelectedDatabase(value);
    resetForm();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Entry</h1>
          <p className="text-muted-foreground">
            Enter daily and weekly checks for your databases
          </p>
        </div>

        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select Database & Date
            </CardTitle>
            <CardDescription>
              Choose the database and date for data entry. Only current date entries are allowed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Date Picker */}
              <div className="flex-1">
                <Label className="mb-2 block">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => !isToday(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">
                  Only current date is available for data entry
                </p>
              </div>

              {/* Database Selector */}
              <div className="flex-1">
                <Label className="mb-2 block">Database</Label>
                <Select value={selectedDatabase} onValueChange={handleDatabaseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a database" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDatabases.map((db) => (
                      <SelectItem key={db.id} value={db.id}>
                        <span className="flex items-center gap-2">
                          <span>{db.databaseName}</span>
                          <span className="text-xs text-muted-foreground">({db.instanceName})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Entry Forms */}
        {selectedDatabase && (
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily Checks</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Checks</TabsTrigger>
            </TabsList>

            {/* Daily Checks Tab */}
            <TabsContent value="daily" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Checks for {selectedDb?.databaseName}</CardTitle>
                  <CardDescription>
                    Record the status of each check for {format(selectedDate, "PPPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {checkTypes.map((checkName, index) => (
                    <div key={checkName} className="space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="lg:w-1/3">
                          <Label className="font-medium">{checkName}</Label>
                        </div>
                        <div className="lg:w-2/3">
                          <RadioGroup
                            value={dailyChecksState[checkName] || 'not_checked'}
                            onValueChange={(value) => handleDailyCheckChange(checkName, value as CheckStatus)}
                            className="flex flex-wrap gap-4"
                          >
                            {statusOptions.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`${checkName}-${option.value}`} />
                                <Label
                                  htmlFor={`${checkName}-${option.value}`}
                                  className={cn("flex items-center gap-1 cursor-pointer", option.color)}
                                >
                                  {option.icon}
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                      <Input
                        placeholder="Comments (optional)"
                        value={dailyComments[checkName] || ''}
                        onChange={(e) => handleCommentChange(checkName, e.target.value)}
                        className="lg:ml-[33.33%] lg:w-2/3"
                      />
                      {index < checkTypes.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveDailyChecks} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Daily Checks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weekly Checks Tab */}
            <TabsContent value="weekly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Checks for {selectedDb?.databaseName}</CardTitle>
                  <CardDescription>
                    Record weekly database metrics for the week of {format(selectedDate, "PPPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="productionDbSize">Production DB Size</Label>
                      <Input
                        id="productionDbSize"
                        placeholder="e.g., 612 GB"
                        value={productionDbSize}
                        onChange={(e) => setProductionDbSize(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="archiveDbSize">Archive DB Size</Label>
                      <Input
                        id="archiveDbSize"
                        placeholder="e.g., 1252 GB"
                        value={archiveDbSize}
                        onChange={(e) => setArchiveDbSize(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invalidObjects">Invalid Objects Count</Label>
                      <Input
                        id="invalidObjects"
                        type="number"
                        placeholder="e.g., 99"
                        value={invalidObjects}
                        onChange={(e) => setInvalidObjects(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instanceStartDate">Instance Start Date</Label>
                      <Input
                        id="instanceStartDate"
                        placeholder="e.g., 23-Feb-2024 09:49:11"
                        value={instanceStartDate}
                        onChange={(e) => setInstanceStartDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveWeeklyChecks} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Weekly Checks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!selectedDatabase && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Database Selected</h3>
              <p className="text-muted-foreground">
                Please select a database above to start entering checks.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
