import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChecks } from '@/contexts/ChecksContext';
import { useDatabases } from '@/contexts/DatabaseContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck,
  AlertTriangle,
  User
} from 'lucide-react';
import { VerificationStatus, DailyCheckSummary, WeeklyCheck } from '@/types';

const Verification = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { getPendingVerifications, verifyDailyCheck, verifyWeeklyCheck, dailyChecksByDatabase, weeklyChecks } = useChecks();
  const { databases } = useDatabases();
  
  const [selectedDailyCheck, setSelectedDailyCheck] = useState<{ databaseId: string; check: DailyCheckSummary } | null>(null);
  const [selectedWeeklyCheck, setSelectedWeeklyCheck] = useState<WeeklyCheck | null>(null);
  const [verificationComment, setVerificationComment] = useState('');
  const [dialogAction, setDialogAction] = useState<'verify' | 'reject' | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { daily: pendingDaily, weekly: pendingWeekly } = getPendingVerifications();

  // Get all checks with their verification status
  const getAllDailyChecks = () => {
    const allChecks: { databaseId: string; check: DailyCheckSummary }[] = [];
    Object.entries(dailyChecksByDatabase).forEach(([databaseId, checks]) => {
      checks.forEach(check => {
        if (check.verification) {
          allChecks.push({ databaseId, check });
        }
      });
    });
    return allChecks.sort((a, b) => new Date(b.check.date).getTime() - new Date(a.check.date).getTime());
  };

  const getAllWeeklyChecks = () => {
    return weeklyChecks
      .filter(check => check.verification)
      .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());
  };

  const handleVerifyDaily = (status: VerificationStatus) => {
    if (!selectedDailyCheck || !user) return;
    
    verifyDailyCheck(
      selectedDailyCheck.databaseId,
      selectedDailyCheck.check.date,
      status,
      user.name,
      verificationComment
    );
    
    toast.success(`Daily check ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
    setSelectedDailyCheck(null);
    setVerificationComment('');
    setDialogAction(null);
  };

  const handleVerifyWeekly = (status: VerificationStatus) => {
    if (!selectedWeeklyCheck || !user) return;
    
    verifyWeeklyCheck(
      selectedWeeklyCheck.id,
      status,
      user.name,
      verificationComment
    );
    
    toast.success(`Weekly check ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
    setSelectedWeeklyCheck(null);
    setVerificationComment('');
    setDialogAction(null);
  };

  const getStatusBadge = (status?: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getDatabaseName = (databaseId: string) => {
    const db = databases.find(d => d.id === databaseId);
    return db?.shortName || databaseId;
  };

  const openVerifyDialog = (type: 'daily' | 'weekly', item: any, action: 'verify' | 'reject') => {
    if (type === 'daily') {
      setSelectedDailyCheck(item);
      setSelectedWeeklyCheck(null);
    } else {
      setSelectedWeeklyCheck(item);
      setSelectedDailyCheck(null);
    }
    setDialogAction(action);
    setVerificationComment('');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" />
              Check Verification
            </h1>
            <p className="text-muted-foreground">Review and verify submitted database checks</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-warning border-warning/30">
              <Clock className="w-3 h-3 mr-1" />
              {pendingDaily.length + pendingWeekly.length} Pending
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingDaily.length + pendingWeekly.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {getAllDailyChecks().filter(d => d.check.verification?.status === 'verified').length + 
                     getAllWeeklyChecks().filter(w => w.verification?.status === 'verified').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {getAllDailyChecks().filter(d => d.check.verification?.status === 'rejected').length + 
                     getAllWeeklyChecks().filter(w => w.verification?.status === 'rejected').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Tables */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
            <CardDescription>Review and approve or reject submitted checks</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">
                  Daily Checks
                  {pendingDaily.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{pendingDaily.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="weekly">
                  Weekly Checks
                  {pendingWeekly.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{pendingWeekly.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                {pendingDaily.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No pending daily checks to verify</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Database</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Checks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDaily.map((item, index) => (
                        <TableRow key={`${item.databaseId}-${index}`}>
                          <TableCell className="font-medium">{getDatabaseName(item.databaseId)}</TableCell>
                          <TableCell>{format(new Date(item.check.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.check.submittedBy || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-success border-success/30">
                                {item.check.checks.filter(c => c.status === 'pass').length} Pass
                              </Badge>
                              <Badge variant="outline" className="text-destructive border-destructive/30">
                                {item.check.checks.filter(c => c.status === 'fail').length} Fail
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.check.verification?.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-success border-success/30 hover:bg-success/10"
                                onClick={() => openVerifyDialog('daily', item, 'verify')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Verify
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => openVerifyDialog('daily', item, 'reject')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="weekly">
                {pendingWeekly.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No pending weekly checks to verify</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Database</TableHead>
                        <TableHead>Week</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingWeekly.map((check) => (
                        <TableRow key={check.id}>
                          <TableCell className="font-medium">{getDatabaseName(check.databaseId)}</TableCell>
                          <TableCell>Week {check.weekNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {check.submittedBy || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {check.productionDbSize && <span>DB: {check.productionDbSize}</span>}
                              {check.invalidObjects !== undefined && <span className="ml-2">Invalid: {check.invalidObjects}</span>}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(check.verification?.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-success border-success/30 hover:bg-success/10"
                                onClick={() => openVerifyDialog('weekly', check, 'verify')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Verify
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => openVerifyDialog('weekly', check, 'reject')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-4">
                  <h3 className="font-medium text-muted-foreground">Recent Verification History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Database</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verified By</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...getAllDailyChecks().filter(d => d.check.verification?.status !== 'pending').slice(0, 10).map(item => ({
                        type: 'Daily',
                        database: getDatabaseName(item.databaseId),
                        date: format(new Date(item.check.date), 'MMM d, yyyy'),
                        status: item.check.verification?.status,
                        verifiedBy: item.check.verification?.verifiedBy,
                        comments: item.check.verification?.comments,
                        verifiedAt: item.check.verification?.verifiedAt,
                      })),
                      ...getAllWeeklyChecks().filter(w => w.verification?.status !== 'pending').slice(0, 10).map(check => ({
                        type: 'Weekly',
                        database: getDatabaseName(check.databaseId),
                        date: `Week ${check.weekNumber}`,
                        status: check.verification?.status,
                        verifiedBy: check.verification?.verifiedBy,
                        comments: check.verification?.comments,
                        verifiedAt: check.verification?.verifiedAt,
                      }))]
                      .sort((a, b) => {
                        const dateA = a.verifiedAt ? new Date(a.verifiedAt).getTime() : 0;
                        const dateB = b.verifiedAt ? new Date(b.verifiedAt).getTime() : 0;
                        return dateB - dateA;
                      })
                      .slice(0, 15)
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">{item.type}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.database}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.verifiedBy || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.comments || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {getAllDailyChecks().filter(d => d.check.verification?.status !== 'pending').length === 0 &&
                   getAllWeeklyChecks().filter(w => w.verification?.status !== 'pending').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No verification history yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Verification Dialog */}
        <Dialog 
          open={!!(selectedDailyCheck || selectedWeeklyCheck) && !!dialogAction} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDailyCheck(null);
              setSelectedWeeklyCheck(null);
              setDialogAction(null);
              setVerificationComment('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogAction === 'verify' ? 'Verify Check' : 'Reject Check'}
              </DialogTitle>
              <DialogDescription>
                {dialogAction === 'verify' 
                  ? 'Confirm that this check has been reviewed and is accurate.'
                  : 'Provide a reason for rejecting this check.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {selectedDailyCheck && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="font-medium">{getDatabaseName(selectedDailyCheck.databaseId)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedDailyCheck.check.date), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Submitted by: {selectedDailyCheck.check.submittedBy || 'Unknown'}
                  </p>
                </div>
              )}
              
              {selectedWeeklyCheck && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="font-medium">{getDatabaseName(selectedWeeklyCheck.databaseId)}</p>
                  <p className="text-sm text-muted-foreground">Week {selectedWeeklyCheck.weekNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted by: {selectedWeeklyCheck.submittedBy || 'Unknown'}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Comments (optional)</label>
                <Textarea
                  value={verificationComment}
                  onChange={(e) => setVerificationComment(e.target.value)}
                  placeholder={dialogAction === 'reject' ? 'Please provide a reason for rejection...' : 'Add any notes about this verification...'}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedDailyCheck(null);
                  setSelectedWeeklyCheck(null);
                  setDialogAction(null);
                  setVerificationComment('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant={dialogAction === 'verify' ? 'default' : 'destructive'}
                onClick={() => {
                  const status = dialogAction === 'verify' ? 'verified' : 'rejected';
                  if (selectedDailyCheck) {
                    handleVerifyDaily(status);
                  } else if (selectedWeeklyCheck) {
                    handleVerifyWeekly(status);
                  }
                }}
              >
                {dialogAction === 'verify' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Verify
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Verification;