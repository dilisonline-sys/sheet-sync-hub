import React from 'react';
import { WeeklyCheck } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Server, Calendar, HardDrive, FileCode, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface WeeklyChecksCardProps {
  databaseName: string;
  fullName: string;
  weeklyCheck: WeeklyCheck;
}

const WeeklyChecksCard: React.FC<WeeklyChecksCardProps> = ({ databaseName, fullName, weeklyCheck }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Server className="w-4 h-4 text-info" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{databaseName}</p>
              <p className="text-xs text-muted-foreground">{fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Week {weeklyCheck.weekNumber}
            </Badge>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-4 border rounded-lg space-y-4">
          {/* Size Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyCheck.productionDbSize && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <HardDrive className="w-3 h-3" />
                  Production DB Size
                </div>
                <p className="font-semibold font-mono">{weeklyCheck.productionDbSize}</p>
              </div>
            )}
            {weeklyCheck.archiveDbSize && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <HardDrive className="w-3 h-3" />
                  Archive DB Size
                </div>
                <p className="font-semibold font-mono">{weeklyCheck.archiveDbSize}</p>
              </div>
            )}
            {weeklyCheck.invalidObjects !== undefined && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <FileCode className="w-3 h-3" />
                  Invalid Objects
                </div>
                <p className="font-semibold font-mono">{weeklyCheck.invalidObjects}</p>
              </div>
            )}
            {weeklyCheck.instanceStartDate && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  Instance Start Date
                </div>
                <p className="font-semibold font-mono text-xs">{weeklyCheck.instanceStartDate}</p>
              </div>
            )}
          </div>

          {/* Schema Sizes */}
          {weeklyCheck.schemaSize && Object.keys(weeklyCheck.schemaSize).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Schema Sizes</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(weeklyCheck.schemaSize).map(([schema, size]) => (
                  <div key={schema} className="flex justify-between items-center p-2 rounded bg-muted/20 text-xs">
                    <span className="text-muted-foreground truncate">{schema}</span>
                    <span className="font-mono font-medium">{size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tablespace Usage */}
          {weeklyCheck.tablespaces && weeklyCheck.tablespaces.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tablespace Usage</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2">Tablespace</th>
                      <th className="text-right px-3 py-2">Total (GB)</th>
                      <th className="text-right px-3 py-2">Used (GB)</th>
                      <th className="text-right px-3 py-2">Free (GB)</th>
                      <th className="text-right px-3 py-2">Used %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyCheck.tablespaces.map((ts, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{ts.name}</td>
                        <td className="text-right px-3 py-2 font-mono">{ts.totalGB}</td>
                        <td className="text-right px-3 py-2 font-mono">{ts.usedGB}</td>
                        <td className="text-right px-3 py-2 font-mono">{ts.freeGB}</td>
                        <td className="text-right px-3 py-2">
                          <Badge 
                            variant="outline" 
                            className={
                              ts.usedPercent >= 85 ? 'text-destructive border-destructive/50' :
                              ts.usedPercent >= 70 ? 'text-warning border-warning/50' :
                              'text-success border-success/50'
                            }
                          >
                            {ts.usedPercent}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Objects Created */}
          {weeklyCheck.objectsCreated && weeklyCheck.objectsCreated.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Objects Created This Week</h4>
              <div className="space-y-2">
                {weeklyCheck.objectsCreated.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{obj.date.toLocaleDateString()}</span>
                      <span className="font-medium">{obj.objectName}</span>
                    </div>
                    <span className="text-muted-foreground truncate max-w-[200px]">{obj.comment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default WeeklyChecksCard;
