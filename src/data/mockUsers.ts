import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@dpccc.ae',
    name: 'Asma Saeed Ahmed Al Marri',
    role: 'admin',
    approvalStatus: 'approved',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2025-01-05'),
  },
  {
    id: '2',
    email: 'mohd.shamim@dpccc.ae',
    name: 'Mohd Shamim Akhtar Akbar Ali',
    role: 'user',
    approvalStatus: 'approved',
    createdAt: new Date('2024-02-20'),
    lastLogin: new Date('2025-01-04'),
  },
  {
    id: '3',
    email: 'dba.user@siemens.com',
    name: 'Siemens DBA',
    role: 'user',
    approvalStatus: 'approved',
    createdAt: new Date('2024-03-10'),
    lastLogin: new Date('2025-01-03'),
  },
  {
    id: '4',
    email: 'new.user@dpccc.ae',
    name: 'Ahmed Hassan',
    role: 'user',
    approvalStatus: 'pending',
    createdAt: new Date('2025-01-02'),
  },
  {
    id: '5',
    email: 'pending.dba@example.com',
    name: 'Sarah Johnson',
    role: 'user',
    approvalStatus: 'pending',
    createdAt: new Date('2025-01-04'),
  },
  {
    id: '6',
    email: 'rejected.user@test.com',
    name: 'John Smith',
    role: 'user',
    approvalStatus: 'rejected',
    createdAt: new Date('2024-12-20'),
  },
];

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getPendingUsers = (): User[] => {
  return mockUsers.filter(user => user.approvalStatus === 'pending');
};

export const getApprovedUsers = (): User[] => {
  return mockUsers.filter(user => user.approvalStatus === 'approved');
};
