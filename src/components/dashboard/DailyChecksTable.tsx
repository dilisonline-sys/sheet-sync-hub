import React from 'react';
import { DailyCheckSummary, CheckStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Server } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DailyChecksTableProps {
  databaseName: string;
  fullName: string;
  checks: DailyCheckSummary[];
}

const DailyChecksTable: React.FC<DailyChecksTableProps> = ({ databaseName, fullName, checks }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!checks.length) return null;

  const latestCheck = checks[0];
  const failedCount = latestCheck.checks.filter(c => c.status === 'fail').length;
  const warningCount = latestCheck.checks.filter(c => c.status === 'warning').length;
  const passedCount = latestCheck.checks.filter(c => c.status === 'pass').length;

  const getStatusCell = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return <span className="text-success">✓</span>;
      case 'fail':
        return <span className="text-destructive">✗</span>;
      case 'warning':
        return <span className="text-warning">⚠</span>;
      default:
        return <span className="text-muted-foreground">-</span>;
    }
  };

  const dates = checks.map(c => c.date);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{databaseName}</p>
              <p className="text-xs text-muted-foreground">{fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="text-success border-success/50">{passedCount} passed</Badge>
              {warningCount > 0 && (
                <Badge variant="outline" className="text-warning border-warning/50">{warningCount} warnings</Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="outline" className="text-destructive border-destructive/50">{failedCount} failed</Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium sticky left-0 bg-muted/50">Check Name</th>
                  {dates.map((date, i) => (
                    <th key={i} className="text-center px-3 py-2 font-medium min-w-[60px]">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {latestCheck.checks.map((check, checkIndex) => (
                  <tr key={checkIndex} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2 font-mono text-xs sticky left-0 bg-card">{check.name}</td>
                    {checks.map((dayCheck, dayIndex) => (
                      <td key={dayIndex} className="text-center px-3 py-2">
                        {getStatusCell(dayCheck.checks[checkIndex]?.status || 'not_checked')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DailyChecksTable;
