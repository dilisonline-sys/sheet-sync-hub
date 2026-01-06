import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, AuthContextType } from '@/types';
import { mockUsers } from '@/data/mockUsers';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for testing
const DEMO_ADMIN = { email: 'admin@dpccc.ae', password: 'admin123' };
const DEMO_USER = { email: 'mohd.shamim@dpccc.ae', password: 'user123' };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('db_monitor_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Rehydrate dates
        parsed.createdAt = new Date(parsed.createdAt);
        if (parsed.lastLogin) parsed.lastLogin = new Date(parsed.lastLogin);
        setUser(parsed);
      } catch {
        localStorage.removeItem('db_monitor_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Demo authentication - in production this would call your backend
    if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      const adminUser = mockUsers.find(u => u.email === DEMO_ADMIN.email);
      if (adminUser && adminUser.approvalStatus === 'approved') {
        const userWithLogin = { ...adminUser, lastLogin: new Date() };
        setUser(userWithLogin);
        localStorage.setItem('db_monitor_user', JSON.stringify(userWithLogin));
        return { success: true };
      }
    }

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const regularUser = mockUsers.find(u => u.email === DEMO_USER.email);
      if (regularUser && regularUser.approvalStatus === 'approved') {
        const userWithLogin = { ...regularUser, lastLogin: new Date() };
        setUser(userWithLogin);
        localStorage.setItem('db_monitor_user', JSON.stringify(userWithLogin));
        return { success: true };
      }
    }

    // Check if user exists but pending/rejected
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      if (existingUser.approvalStatus === 'pending') {
        return { success: false, error: 'Your account is pending approval. Please wait for an administrator to approve your access.' };
      }
      if (existingUser.approvalStatus === 'rejected') {
        return { success: false, error: 'Your account has been rejected. Please contact an administrator.' };
      }
    }

    return { success: false, error: 'Invalid email or password. Try admin@dpccc.ae / admin123' };
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // In production, this would create the user in the database
    // For demo, we just show success message
    return { 
      success: true, 
      error: undefined 
    };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('db_monitor_user');
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && user.approvalStatus === 'approved',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
