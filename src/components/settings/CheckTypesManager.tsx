import { useState } from 'react';
import { Plus, Trash2, RotateCcw, Check, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCheckTypes } from '@/contexts/CheckTypesContext';
import { useDatabases } from '@/contexts/DatabaseContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const CheckTypesManager = () => {
  const { toast } = useToast();
  const { databases } = useDatabases();
  const {
    dailyCheckTypes,
    weeklyCheckTypes,
    addDailyCheck,
    removeDailyCheck,
    addWeeklyCheck,
    removeWeeklyCheck,
    initializeChecksForDatabase,
    resetToDefaults,
  } = useCheckTypes();

  const [selectedDatabase, setSelectedDatabase] = useState<string>(databases[0]?.id || '');
  const [newDailyCheck, setNewDailyCheck] = useState('');
  const [newWeeklyCheck, setNewWeeklyCheck] = useState('');
  const [pendingChanges, setPendingChanges] = useState<{
    daily: { dbId: string; action: 'add' | 'remove'; checkName: string }[];
    weekly: { dbId: string; action: 'add' | 'remove'; checkName: string }[];
  }>({ daily: [], weekly: [] });

  const selectedDb = databases.find(db => db.id === selectedDatabase);

  const handleAddDailyCheck = () => {
    if (!newDailyCheck.trim() || !selectedDatabase) return;
    setPendingChanges(prev => ({
      ...prev,
      daily: [...prev.daily, { dbId: selectedDatabase, action: 'add', checkName: newDailyCheck.trim() }],
    }));
    setNewDailyCheck('');
  };

  const handleRemoveDailyCheck = (checkName: string) => {
    setPendingChanges(prev => ({
      ...prev,
      daily: [...prev.daily, { dbId: selectedDatabase, action: 'remove', checkName }],
    }));
  };

  const handleAddWeeklyCheck = () => {
    if (!newWeeklyCheck.trim() || !selectedDatabase) return;
    setPendingChanges(prev => ({
      ...prev,
      weekly: [...prev.weekly, { dbId: selectedDatabase, action: 'add', checkName: newWeeklyCheck.trim() }],
    }));
    setNewWeeklyCheck('');
  };

  const handleRemoveWeeklyCheck = (checkName: string) => {
    setPendingChanges(prev => ({
      ...prev,
      weekly: [...prev.weekly, { dbId: selectedDatabase, action: 'remove', checkName }],
    }));
  };

  const applyChanges = () => {
    pendingChanges.daily.forEach(change => {
      if (change.action === 'add') {
        addDailyCheck(change.dbId, change.checkName);
      } else {
        removeDailyCheck(change.dbId, change.checkName);
      }
    });

    pendingChanges.weekly.forEach(change => {
      if (change.action === 'add') {
        addWeeklyCheck(change.dbId, change.checkName);
      } else {
        removeWeeklyCheck(change.dbId, change.checkName);
      }
    });

    setPendingChanges({ daily: [], weekly: [] });
    toast({
      title: 'Changes Applied',
      description: 'Check types have been updated and will reflect in Data Entry and Dashboard.',
    });
  };

  const cancelChanges = () => {
    setPendingChanges({ daily: [], weekly: [] });
    setNewDailyCheck('');
    setNewWeeklyCheck('');
    toast({ title: 'Changes Cancelled', description: 'Pending changes have been discarded.' });
  };

  const handleReset = () => {
    resetToDefaults();
    setPendingChanges({ daily: [], weekly: [] });
    toast({ title: 'Reset Complete', description: 'All check types have been reset to defaults.' });
  };

  const handleInitializeDatabase = () => {
    if (selectedDb) {
      initializeChecksForDatabase(selectedDatabase, selectedDb.type);
      toast({ title: 'Checks Initialized', description: `Default checks have been set for ${selectedDb.shortName}.` });
    }
  };

  const hasPendingChanges = pendingChanges.daily.length > 0 || pendingChanges.weekly.length > 0;

  const getEffectiveChecks = (type: 'daily' | 'weekly') => {
    const baseChecks = type === 'daily' 
      ? dailyCheckTypes[selectedDatabase] || [] 
      : weeklyCheckTypes[selectedDatabase] || [];
    const changes = type === 'daily' ? pendingChanges.daily : pendingChanges.weekly;
    
    let effectiveChecks = [...baseChecks];
    changes.filter(c => c.dbId === selectedDatabase).forEach(change => {
      if (change.action === 'add' && !effectiveChecks.includes(change.checkName)) {
        effectiveChecks.push(change.checkName);
      } else if (change.action === 'remove') {
        effectiveChecks = effectiveChecks.filter(c => c !== change.checkName);
      }
    });
    
    return effectiveChecks;
  };

  const isPendingAdd = (checkName: string, type: 'daily' | 'weekly') => {
    const changes = type === 'daily' ? pendingChanges.daily : pendingChanges.weekly;
    return changes.some(c => c.dbId === selectedDatabase && c.checkName === checkName && c.action === 'add');
  };

  const isPendingRemove = (checkName: string, type: 'daily' | 'weekly') => {
    const changes = type === 'daily' ? pendingChanges.daily : pendingChanges.weekly;
    return changes.some(c => c.dbId === selectedDatabase && c.checkName === checkName && c.action === 'remove');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Check Types Management</CardTitle>
            <CardDescription>
              Configure daily and weekly check types for each database
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all check types for all databases to their original defaults.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Database Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Select Database:</span>
          </div>
          <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a database" />
            </SelectTrigger>
            <SelectContent>
              {databases.map(db => (
                <SelectItem key={db.id} value={db.id}>
                  {db.shortName} - {db.databaseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDb && !dailyCheckTypes[selectedDatabase]?.length && (
            <Button variant="outline" size="sm" onClick={handleInitializeDatabase}>
              Initialize Default Checks
            </Button>
          )}
        </div>

        {hasPendingChanges && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {pendingChanges.daily.length + pendingChanges.weekly.length} pending changes
              </Badge>
              <span className="text-sm text-muted-foreground">Click Apply to save changes</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelChanges}>Cancel</Button>
              <Button size="sm" onClick={applyChanges}>
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            </div>
          </div>
        )}

        {selectedDatabase && (
          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily Checks ({getEffectiveChecks('daily').length})</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Checks ({getEffectiveChecks('weekly').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new daily check..."
                  value={newDailyCheck}
                  onChange={(e) => setNewDailyCheck(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDailyCheck()}
                />
                <Button onClick={handleAddDailyCheck} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {getEffectiveChecks('daily').map(check => (
                  <Badge
                    key={check}
                    variant={isPendingAdd(check, 'daily') ? 'default' : isPendingRemove(check, 'daily') ? 'destructive' : 'secondary'}
                    className="flex items-center gap-1 py-1.5 px-3"
                  >
                    {check}
                    {!isPendingRemove(check, 'daily') && (
                      <button onClick={() => handleRemoveDailyCheck(check)} className="ml-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {getEffectiveChecks('daily').length === 0 && (
                  <p className="text-sm text-muted-foreground">No checks configured. Add checks or initialize defaults.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new weekly check..."
                  value={newWeeklyCheck}
                  onChange={(e) => setNewWeeklyCheck(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWeeklyCheck()}
                />
                <Button onClick={handleAddWeeklyCheck} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {getEffectiveChecks('weekly').map(check => (
                  <Badge
                    key={check}
                    variant={isPendingAdd(check, 'weekly') ? 'default' : isPendingRemove(check, 'weekly') ? 'destructive' : 'secondary'}
                    className="flex items-center gap-1 py-1.5 px-3"
                  >
                    {check}
                    {!isPendingRemove(check, 'weekly') && (
                      <button onClick={() => handleRemoveWeeklyCheck(check)} className="ml-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {getEffectiveChecks('weekly').length === 0 && (
                  <p className="text-sm text-muted-foreground">No checks configured. Add checks or initialize defaults.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
