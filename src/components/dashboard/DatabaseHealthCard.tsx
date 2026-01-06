import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseHealthCardProps {
  dbId: string;
  dbName: string;
  fullName: string;
  health: 'healthy' | 'warning' | 'critical';
  failedCount: number;
  warningCount: number;
  passedCount: number;
  type: string;
}

const DatabaseHealthCard: React.FC<DatabaseHealthCardProps> = ({
  dbName,
  fullName,
  health,
  failedCount,
  warningCount,
  passedCount,
  type,
}) => {
  const getHealthStyles = () => {
    switch (health) {
      case 'healthy':
        return {
          border: 'border-success/30',
          glow: 'glow-success',
          icon: CheckCircle2,
          iconColor: 'text-success',
          bgColor: 'bg-success/10',
        };
      case 'warning':
        return {
          border: 'border-warning/30',
          glow: 'glow-warning',
          icon: AlertTriangle,
          iconColor: 'text-warning',
          bgColor: 'bg-warning/10',
        };
      case 'critical':
        return {
          border: 'border-destructive/30',
          glow: 'glow-destructive',
          icon: XCircle,
          iconColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
        };
    }
  };

  const styles = getHealthStyles();
  const Icon = styles.icon;

  const getTypeBadge = () => {
    switch (type) {
      case 'primary':
        return <Badge variant="outline" className="text-xs">Production</Badge>;
      case 'standby':
        return <Badge variant="outline" className="text-xs">Standby</Badge>;
      case 'archive':
        return <Badge variant="outline" className="text-xs">Archive</Badge>;
      case 'oem':
        return <Badge variant="outline" className="text-xs">OEM</Badge>;
      case 'audit_vault':
        return <Badge variant="outline" className="text-xs">Audit</Badge>;
      case 'firewall':
        return <Badge variant="outline" className="text-xs">Firewall</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  return (
    <Card className={cn(
      'bg-card border transition-all hover:scale-[1.02]',
      styles.border
    )}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', styles.bgColor)}>
              <Server className={cn('w-4 h-4', styles.iconColor)} />
            </div>
            <div>
              <p className="font-semibold text-sm">{dbName}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{fullName}</p>
            </div>
          </div>
          <Icon className={cn('w-5 h-5', styles.iconColor)} />
        </div>
        
        <div className="flex items-center justify-between">
          {getTypeBadge()}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success">{passedCount}✓</span>
            <span className="text-warning">{warningCount}⚠</span>
            <span className="text-destructive">{failedCount}✗</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseHealthCard;
