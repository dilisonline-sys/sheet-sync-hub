import React, { useState } from 'react';
import { mockUsers } from '@/data/mockUsers';
import { User, ApprovalStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Shield,
  Users,
  UserPlus
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

const UserManagement = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleApprove = (userId: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, approvalStatus: 'approved' as ApprovalStatus } 
          : user
      )
    );
    toast.success('User approved successfully');
  };

  const handleReject = (userId: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, approvalStatus: 'rejected' as ApprovalStatus } 
          : user
      )
    );
    toast.success('User rejected');
  };

  const handleToggleAdmin = (userId: string) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, role: user.role === 'admin' ? 'user' : 'admin' } 
          : user
      )
    );
    toast.success('User role updated');
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(u => u.approvalStatus === 'pending');
  const approvedUsers = filteredUsers.filter(u => u.approvalStatus === 'approved');
  const rejectedUsers = filteredUsers.filter(u => u.approvalStatus === 'rejected');

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-success border-success"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-destructive border-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  const UserTable = ({ users: tableUsers, showActions = true }: { users: User[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableUsers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 6 : 5} className="text-center text-muted-foreground py-8">
              No users found
            </TableCell>
          </TableRow>
        ) : (
          tableUsers.map((user) => (
            <TableRow key={user.id} className="group">
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : null}
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{getStatusBadge(user.approvalStatus)}</TableCell>
              <TableCell className="text-muted-foreground">
                {user.createdAt.toLocaleDateString()}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.approvalStatus === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                            <UserCheck className="w-4 h-4 mr-2 text-success" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(user.id)}>
                            <UserX className="w-4 h-4 mr-2 text-destructive" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.approvalStatus === 'approved' && (
                        <>
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user.id)}>
                            <Shield className="w-4 h-4 mr-2" />
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(user.id)} className="text-destructive">
                            <UserX className="w-4 h-4 mr-2" />
                            Disable Access
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.approvalStatus === 'rejected' && (
                        <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                          <UserCheck className="w-4 h-4 mr-2 text-success" />
                          Re-approve
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage user access and approvals</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <UserPlus className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedUsers.filter(u => u.role === 'admin').length}</p>
                  <p className="text-sm text-muted-foreground">Administrators</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>View and manage all user accounts</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="gap-2">
                  Pending
                  {pendingUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{pendingUsers.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All Users</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <UserTable users={pendingUsers} />
              </TabsContent>
              <TabsContent value="approved">
                <UserTable users={approvedUsers} />
              </TabsContent>
              <TabsContent value="rejected">
                <UserTable users={rejectedUsers} />
              </TabsContent>
              <TabsContent value="all">
                <UserTable users={filteredUsers} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UserManagement;
