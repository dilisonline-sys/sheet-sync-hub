import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseConnection } from '@/components/settings/DatabaseConnection';
import { CheckTypesManager } from '@/components/settings/CheckTypesManager';
import { DatabaseManager } from '@/components/settings/DatabaseManager';
import { Settings as SettingsIcon, Database, ListChecks, Server, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChecks } from '@/contexts/ChecksContext';
import { toast } from 'sonner';
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

const Settings = () => {
  const { clearAllChecks } = useChecks();

  const handleClearAllData = () => {
    clearAllChecks();
    toast.success('All checks data has been cleared');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure databases, check types, and connection settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="databases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="databases" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Databases
            </TabsTrigger>
            <TabsTrigger value="checks" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Check Types
            </TabsTrigger>
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Data Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="databases">
            <DatabaseManager />
          </TabsContent>

          <TabsContent value="checks">
            <CheckTypesManager />
          </TabsContent>

          <TabsContent value="connection">
            <DatabaseConnection />
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Clear All Checks Data
                </CardTitle>
                <CardDescription>
                  Permanently delete all daily and weekly check data from the application.
                  This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all daily and weekly check data.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAllData}>
                        Yes, clear all data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
