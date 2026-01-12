import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Shield, Activity, Clock, User, LogIn, LogOut, Settings, FileEdit, UserPlus, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';

// Mock audit log data
const mockAuditLogs = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Ahmed Al Mansoori',
    userEmail: 'admin@dpccc.ae',
    action: 'LOGIN',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.100',
    timestamp: new Date('2026-01-12T08:30:00'),
    status: 'success'
  },
  {
    id: '2',
    userId: 'user-1',
    userName: 'Ahmed Al Mansoori',
    userEmail: 'admin@dpccc.ae',
    action: 'USER_APPROVED',
    details: 'Approved user: mohd.shamim@dpccc.ae',
    ipAddress: '192.168.1.100',
    timestamp: new Date('2026-01-12T08:35:00'),
    status: 'success'
  },
  {
    id: '3',
    userId: 'user-2',
    userName: 'Mohammed Shamim',
    userEmail: 'mohd.shamim@dpccc.ae',
    action: 'LOGIN',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.105',
    timestamp: new Date('2026-01-12T09:00:00'),
    status: 'success'
  },
  {
    id: '4',
    userId: 'user-2',
    userName: 'Mohammed Shamim',
    userEmail: 'mohd.shamim@dpccc.ae',
    action: 'DATA_ENTRY',
    details: 'Added daily check for DPCCC_PRIMARY',
    ipAddress: '192.168.1.105',
    timestamp: new Date('2026-01-12T09:15:00'),
    status: 'success'
  },
  {
    id: '5',
    userId: 'user-1',
    userName: 'Ahmed Al Mansoori',
    userEmail: 'admin@dpccc.ae',
    action: 'SETTINGS_CHANGE',
    details: 'Added new check type: Backup Verification',
    ipAddress: '192.168.1.100',
    timestamp: new Date('2026-01-12T10:00:00'),
    status: 'success'
  },
  {
    id: '6',
    userId: 'user-3',
    userName: 'Fatima Hassan',
    userEmail: 'fatima.hassan@dpccc.ae',
    action: 'LOGIN_FAILED',
    details: 'Invalid password attempt',
    ipAddress: '192.168.1.110',
    timestamp: new Date('2026-01-12T10:30:00'),
    status: 'failed'
  },
  {
    id: '7',
    userId: 'user-1',
    userName: 'Ahmed Al Mansoori',
    userEmail: 'admin@dpccc.ae',
    action: 'USER_REJECTED',
    details: 'Rejected user: test.user@dpccc.ae',
    ipAddress: '192.168.1.100',
    timestamp: new Date('2026-01-12T11:00:00'),
    status: 'success'
  },
  {
    id: '8',
    userId: 'user-2',
    userName: 'Mohammed Shamim',
    userEmail: 'mohd.shamim@dpccc.ae',
    action: 'LOGOUT',
    details: 'User logged out',
    ipAddress: '192.168.1.105',
    timestamp: new Date('2026-01-12T12:00:00'),
    status: 'success'
  },
  {
    id: '9',
    userId: 'user-4',
    userName: 'Unknown',
    userEmail: 'unknown@external.com',
    action: 'REGISTRATION',
    details: 'New user registration submitted',
    ipAddress: '10.0.0.55',
    timestamp: new Date('2026-01-11T14:00:00'),
    status: 'success'
  },
  {
    id: '10',
    userId: 'user-1',
    userName: 'Ahmed Al Mansoori',
    userEmail: 'admin@dpccc.ae',
    action: 'DATABASE_ADDED',
    details: 'Added new database: DPCCC_DR',
    ipAddress: '192.168.1.100',
    timestamp: new Date('2026-01-11T15:30:00'),
    status: 'success'
  },
];

const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  LOGIN: { icon: LogIn, color: 'bg-green-500/10 text-green-500', label: 'Login' },
  LOGOUT: { icon: LogOut, color: 'bg-muted text-muted-foreground', label: 'Logout' },
  LOGIN_FAILED: { icon: LogIn, color: 'bg-destructive/10 text-destructive', label: 'Login Failed' },
  REGISTRATION: { icon: UserPlus, color: 'bg-blue-500/10 text-blue-500', label: 'Registration' },
  USER_APPROVED: { icon: UserCheck, color: 'bg-green-500/10 text-green-500', label: 'User Approved' },
  USER_REJECTED: { icon: UserX, color: 'bg-destructive/10 text-destructive', label: 'User Rejected' },
  SETTINGS_CHANGE: { icon: Settings, color: 'bg-orange-500/10 text-orange-500', label: 'Settings Changed' },
  DATA_ENTRY: { icon: FileEdit, color: 'bg-primary/10 text-primary', label: 'Data Entry' },
  DATABASE_ADDED: { icon: Activity, color: 'bg-purple-500/10 text-purple-500', label: 'Database Added' },
};

const UserAudit: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Filter logs
  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesAction && matchesStatus;
  });

  // Stats
  const totalActions = mockAuditLogs.length;
  const loginAttempts = mockAuditLogs.filter(l => l.action === 'LOGIN' || l.action === 'LOGIN_FAILED').length;
  const failedActions = mockAuditLogs.filter(l => l.status === 'failed').length;
  const uniqueUsers = new Set(mockAuditLogs.map(l => l.userId)).size;

  const getActionBadge = (action: string) => {
    const config = actionConfig[action] || { icon: Activity, color: 'bg-muted text-muted-foreground', label: action };
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} border-0 gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              User Audit Log
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and track all user activities in the system
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Actions</CardDescription>
              <CardTitle className="text-2xl">{totalActions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                All recorded events
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Login Attempts</CardDescription>
              <CardTitle className="text-2xl">{loginAttempts}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LogIn className="w-4 h-4" />
                Success & failed logins
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed Actions</CardDescription>
              <CardTitle className="text-2xl text-destructive">{failedActions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                Requires attention
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Users</CardDescription>
              <CardTitle className="text-2xl">{uniqueUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Active in system
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, email, details, or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="REGISTRATION">Registration</SelectItem>
                  <SelectItem value="USER_APPROVED">User Approved</SelectItem>
                  <SelectItem value="USER_REJECTED">User Rejected</SelectItem>
                  <SelectItem value="SETTINGS_CHANGE">Settings Changed</SelectItem>
                  <SelectItem value="DATA_ENTRY">Data Entry</SelectItem>
                  <SelectItem value="DATABASE_ADDED">Database Added</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {mockAuditLogs.length} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">{format(log.timestamp, 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(log.timestamp, 'HH:mm:ss')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {log.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{log.userName}</div>
                            <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground truncate block">
                          {log.details}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{log.ipAddress}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status === 'success' ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UserAudit;
