import { useState } from 'react';
import { Plus, Trash2, RotateCcw, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCheckTypes } from '@/contexts/CheckTypesContext';
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
  const {
    dailyCheckTypes,
    weeklyCheckTypes,
    categories,
    addDailyCheck,
    removeDailyCheck,
    addWeeklyCheck,
    removeWeeklyCheck,
    resetToDefaults,
  } = useCheckTypes();

  const [newDailyChecks, setNewDailyChecks] = useState<Record<string, string>>({});
  const [newWeeklyChecks, setNewWeeklyChecks] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<{
    daily: { categoryId: string; action: 'add' | 'remove'; checkName: string }[];
    weekly: { categoryId: string; action: 'add' | 'remove'; checkName: string }[];
  }>({ daily: [], weekly: [] });

  const handleAddDailyCheck = (categoryId: string) => {
    const checkName = newDailyChecks[categoryId];
    if (!checkName?.trim()) return;
    
    setPendingChanges(prev => ({
      ...prev,
      daily: [...prev.daily, { categoryId, action: 'add', checkName: checkName.trim() }],
    }));
    setNewDailyChecks(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveDailyCheck = (categoryId: string, checkName: string) => {
    setPendingChanges(prev => ({
      ...prev,
      daily: [...prev.daily, { categoryId, action: 'remove', checkName }],
    }));
  };

  const handleAddWeeklyCheck = (categoryId: string) => {
    const checkName = newWeeklyChecks[categoryId];
    if (!checkName?.trim()) return;
    
    setPendingChanges(prev => ({
      ...prev,
      weekly: [...prev.weekly, { categoryId, action: 'add', checkName: checkName.trim() }],
    }));
    setNewWeeklyChecks(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveWeeklyCheck = (categoryId: string, checkName: string) => {
    setPendingChanges(prev => ({
      ...prev,
      weekly: [...prev.weekly, { categoryId, action: 'remove', checkName }],
    }));
  };

  const applyChanges = () => {
    // Apply daily changes
    pendingChanges.daily.forEach(change => {
      if (change.action === 'add') {
        addDailyCheck(change.categoryId, change.checkName);
      } else {
        removeDailyCheck(change.categoryId, change.checkName);
      }
    });

    // Apply weekly changes
    pendingChanges.weekly.forEach(change => {
      if (change.action === 'add') {
        addWeeklyCheck(change.categoryId, change.checkName);
      } else {
        removeWeeklyCheck(change.categoryId, change.checkName);
      }
    });

    setPendingChanges({ daily: [], weekly: [] });
    toast({
      title: 'Changes Applied',
      description: 'Check types have been updated and will reflect in Data Entry.',
    });
  };

  const cancelChanges = () => {
    setPendingChanges({ daily: [], weekly: [] });
    toast({
      title: 'Changes Cancelled',
      description: 'Pending changes have been discarded.',
    });
  };

  const handleReset = () => {
    resetToDefaults();
    setPendingChanges({ daily: [], weekly: [] });
    toast({
      title: 'Reset Complete',
      description: 'All check types have been reset to defaults.',
    });
  };

  const hasPendingChanges = pendingChanges.daily.length > 0 || pendingChanges.weekly.length > 0;

  const getEffectiveChecks = (categoryId: string, type: 'daily' | 'weekly') => {
    const baseChecks = type === 'daily' ? dailyCheckTypes[categoryId] || [] : weeklyCheckTypes[categoryId] || [];
    const changes = type === 'daily' ? pendingChanges.daily : pendingChanges.weekly;
    
    let effectiveChecks = [...baseChecks];
    changes.filter(c => c.categoryId === categoryId).forEach(change => {
      if (change.action === 'add' && !effectiveChecks.includes(change.checkName)) {
        effectiveChecks.push(change.checkName);
      } else if (change.action === 'remove') {
        effectiveChecks = effectiveChecks.filter(c => c !== change.checkName);
      }
    });
    
    return effectiveChecks;
  };

  const isPendingAdd = (categoryId: string, checkName: string, type: 'daily' | 'weekly') => {
    const changes = type === 'daily' ? pendingChanges.daily : pendingChanges.weekly;
    return changes.some(c => c.categoryId === categoryId && c.checkName === checkName && c.action === 'add');
  };

  const isPendingRemove = (categoryId: string, checkName: string, type: 'daily' | 'weekly') => {
    const changes = type === 'daily' ? pendingChanges.daily : pendingChanges.weekly;
    return changes.some(c => c.categoryId === categoryId && c.checkName === checkName && c.action === 'remove');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Check Types Management</CardTitle>
            <CardDescription>
              Add or remove check types for each database category. Changes will apply to Data Entry.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all check types to their original defaults. Any custom checks you've added will be removed.
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
        {hasPendingChanges && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {pendingChanges.daily.length + pendingChanges.weekly.length} pending changes
              </Badge>
              <span className="text-sm text-muted-foreground">
                Click Apply to save changes
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelChanges}>
                Cancel
              </Button>
              <Button size="sm" onClick={applyChanges}>
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Daily Checks</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Checks</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6 mt-4">
            {categories.map(category => (
              <div key={category.id} className="space-y-4">
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new check..."
                    value={newDailyChecks[category.id] || ''}
                    onChange={(e) => setNewDailyChecks(prev => ({ ...prev, [category.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDailyCheck(category.id)}
                  />
                  <Button onClick={() => handleAddDailyCheck(category.id)} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getEffectiveChecks(category.id, 'daily').map(check => (
                    <Badge
                      key={check}
                      variant={isPendingAdd(category.id, check, 'daily') ? 'default' : isPendingRemove(category.id, check, 'daily') ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1 py-1.5 px-3"
                    >
                      {check}
                      {!isPendingRemove(category.id, check, 'daily') && (
                        <button
                          onClick={() => handleRemoveDailyCheck(category.id, check)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                <Separator />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6 mt-4">
            {categories.map(category => (
              <div key={category.id} className="space-y-4">
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new check..."
                    value={newWeeklyChecks[category.id] || ''}
                    onChange={(e) => setNewWeeklyChecks(prev => ({ ...prev, [category.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWeeklyCheck(category.id)}
                  />
                  <Button onClick={() => handleAddWeeklyCheck(category.id)} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getEffectiveChecks(category.id, 'weekly').map(check => (
                    <Badge
                      key={check}
                      variant={isPendingAdd(category.id, check, 'weekly') ? 'default' : isPendingRemove(category.id, check, 'weekly') ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1 py-1.5 px-3"
                    >
                      {check}
                      {!isPendingRemove(category.id, check, 'weekly') && (
                        <button
                          onClick={() => handleRemoveWeeklyCheck(category.id, check)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                <Separator />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
