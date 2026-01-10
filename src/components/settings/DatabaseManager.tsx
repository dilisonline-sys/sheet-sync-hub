import { useState } from 'react';
import { Plus, Trash2, Database, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabases } from '@/contexts/DatabaseContext';
import { useToast } from '@/hooks/use-toast';
import { DatabaseInstance } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

const DATABASE_TYPES: DatabaseInstance['type'][] = ['primary', 'standby', 'archive', 'gis', 'pilot', 'oem', 'audit_vault', 'firewall'];

const getTypeColor = (type: DatabaseInstance['type']) => {
  const colors: Record<DatabaseInstance['type'], string> = {
    primary: 'bg-blue-500/10 text-blue-500',
    standby: 'bg-green-500/10 text-green-500',
    archive: 'bg-purple-500/10 text-purple-500',
    gis: 'bg-orange-500/10 text-orange-500',
    pilot: 'bg-yellow-500/10 text-yellow-500',
    oem: 'bg-cyan-500/10 text-cyan-500',
    audit_vault: 'bg-red-500/10 text-red-500',
    firewall: 'bg-pink-500/10 text-pink-500',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
};

export const DatabaseManager = () => {
  const { toast } = useToast();
  const { databases, addDatabase, removeDatabase } = useDatabases();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDatabase, setNewDatabase] = useState<Partial<DatabaseInstance>>({
    type: 'primary',
  });

  const handleAddDatabase = () => {
    if (!newDatabase.databaseName || !newDatabase.shortName || !newDatabase.type) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    addDatabase({
      databaseName: newDatabase.databaseName,
      shortName: newDatabase.shortName,
      instanceName: newDatabase.instanceName || newDatabase.shortName,
      ipAddress: newDatabase.ipAddress || '',
      hostName: newDatabase.hostName || '',
      type: newDatabase.type as DatabaseInstance['type'],
      vCPU: newDatabase.vCPU,
      ram: newDatabase.ram,
      sga: newDatabase.sga,
      softwareVersion: newDatabase.softwareVersion,
      osVersion: newDatabase.osVersion,
    });

    setNewDatabase({ type: 'primary' });
    setIsAddDialogOpen(false);
    toast({ title: 'Database Added', description: `${newDatabase.shortName} has been added successfully.` });
  };

  const handleRemoveDatabase = (id: string, name: string) => {
    removeDatabase(id);
    toast({ title: 'Database Removed', description: `${name} has been removed.` });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>
              Add, edit, or remove databases for health monitoring
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Database
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Database</DialogTitle>
                <DialogDescription>
                  Add a new database to the monitoring system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbName">Database Name *</Label>
                    <Input
                      id="dbName"
                      placeholder="Production Database"
                      value={newDatabase.databaseName || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, databaseName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortName">Short Name *</Label>
                    <Input
                      id="shortName"
                      placeholder="PRODDB"
                      value={newDatabase.shortName || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instanceName">Instance Name</Label>
                    <Input
                      id="instanceName"
                      placeholder="PRODDB01"
                      value={newDatabase.instanceName || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, instanceName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={newDatabase.type}
                      onValueChange={(value) => setNewDatabase(prev => ({ ...prev, type: value as DatabaseInstance['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATABASE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hostName">Host Name</Label>
                    <Input
                      id="hostName"
                      placeholder="hostname01"
                      value={newDatabase.hostName || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, hostName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      placeholder="10.0.0.1"
                      value={newDatabase.ipAddress || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, ipAddress: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vCPU">vCPU</Label>
                    <Input
                      id="vCPU"
                      type="number"
                      placeholder="8"
                      value={newDatabase.vCPU || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, vCPU: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ram">RAM</Label>
                    <Input
                      id="ram"
                      placeholder="64 GB"
                      value={newDatabase.ram || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, ram: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sga">SGA</Label>
                    <Input
                      id="sga"
                      placeholder="32 GB"
                      value={newDatabase.sga || ''}
                      onChange={(e) => setNewDatabase(prev => ({ ...prev, sga: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="softwareVersion">Software Version</Label>
                  <Input
                    id="softwareVersion"
                    placeholder="Oracle 19c"
                    value={newDatabase.softwareVersion || ''}
                    onChange={(e) => setNewDatabase(prev => ({ ...prev, softwareVersion: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddDatabase}>Add Database</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {databases.map((db) => (
            <div
              key={db.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{db.shortName}</span>
                    <Badge className={getTypeColor(db.type)}>
                      {db.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{db.databaseName}</p>
                  {db.hostName && (
                    <p className="text-xs text-muted-foreground">{db.hostName} • {db.ipAddress}</p>
                  )}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Database?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove {db.shortName} from the monitoring system. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRemoveDatabase(db.id, db.shortName)}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
