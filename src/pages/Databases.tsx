import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockDatabases } from '@/data/mockDatabases';
import { Server, Cpu, HardDrive, Database as DatabaseIcon } from 'lucide-react';

const Databases = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      primary: { label: 'Production', className: 'bg-primary/10 text-primary border-primary/30' },
      standby: { label: 'Standby', className: 'bg-info/10 text-info border-info/30' },
      archive: { label: 'Archive', className: 'bg-warning/10 text-warning border-warning/30' },
      gis: { label: 'GIS', className: 'bg-success/10 text-success border-success/30' },
      oem: { label: 'OEM', className: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
      pilot: { label: 'Pilot', className: 'bg-muted text-muted-foreground border-border' },
      audit_vault: { label: 'Audit Vault', className: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
      firewall: { label: 'Firewall', className: 'bg-destructive/10 text-destructive border-destructive/30' },
    };
    const variant = variants[type] || variants.primary;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Databases</h1>
          <p className="text-muted-foreground">Infrastructure overview for all monitored databases</p>
        </div>

        {/* Database Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockDatabases.map((db) => (
            <Card key={db.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Server className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{db.shortName}</CardTitle>
                      <CardDescription className="text-xs">{db.databaseName}</CardDescription>
                    </div>
                  </div>
                  {getTypeBadge(db.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instance Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Instance Name</p>
                    <p className="font-mono text-sm">{db.instanceName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Host Name</p>
                    <p className="font-mono text-sm truncate">{db.hostName}</p>
                  </div>
                </div>

                {/* Hardware Info */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">vCPU</p>
                      <p className="font-semibold">{db.vCPU}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">RAM</p>
                      <p className="font-semibold">{db.ram}</p>
                    </div>
                  </div>
                  {db.sga && (
                    <div className="flex items-center gap-2">
                      <DatabaseIcon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">SGA</p>
                        <p className="font-semibold">{db.sga}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Software Info */}
                <div className="pt-2 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Software Version</p>
                      <p className="text-xs font-mono">{db.softwareVersion}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">OS Version</p>
                      <p className="text-xs font-mono truncate">{db.osVersion}</p>
                    </div>
                  </div>
                </div>

                {/* IP Address */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-mono text-sm text-muted-foreground">{db.ipAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Databases;
