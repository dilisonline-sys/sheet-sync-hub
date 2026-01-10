import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseConnection } from '@/components/settings/DatabaseConnection';
import { CheckTypesManager } from '@/components/settings/CheckTypesManager';
import { DatabaseManager } from '@/components/settings/DatabaseManager';
import { Settings as SettingsIcon, Database, ListChecks, Server } from 'lucide-react';

const Settings = () => {
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
