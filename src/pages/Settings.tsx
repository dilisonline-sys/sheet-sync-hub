import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseConnection } from '@/components/settings/DatabaseConnection';
import { CheckTypesManager } from '@/components/settings/CheckTypesManager';
import { Settings as SettingsIcon, Database, ListChecks } from 'lucide-react';

const Settings = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure database connection and application settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="database" className="space-y-4">
          <TabsList>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="checks" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Check Types
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            <DatabaseConnection />
          </TabsContent>

          <TabsContent value="checks">
            <CheckTypesManager />
          </TabsContent>

          <TabsContent value="general">
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              General settings coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
