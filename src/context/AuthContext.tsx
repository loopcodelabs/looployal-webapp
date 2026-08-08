import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Employee, BusinessMembership, UserRole } from '../types';
import { api, setStoredToken, removeStoredToken, getStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  memberships: BusinessMembership[];
  token: string | null;
  loading: boolean;
  error: string | null;
  loginWithOTP: (mobileNumber: string, otp: string) => Promise<void>;
  loginStaff: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  getRedirectPathForRole: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getRedirectPathForRole = (role: UserRole): string => {
  switch (role) {
    case 'CUSTOMER':
      return '/customer';
    case 'CASHIER':
      return '/cashier';
    case 'BRANCH_MANAGER':
    case 'BUSINESS_OWNER':
      return '/merchant';
    case 'PLATFORM_ADMIN':
      return '/admin';
    default:
      return '/login';
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [memberships, setMemberships] = useState<BusinessMembership[]>([]);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUserData = async () => {
    if (!getStoredToken()) {
      setUser(null);
      setEmployee(null);
      setMemberships([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.getCurrentUser();
      setUser(res.user);
      setEmployee(res.employee || null);
      setMemberships(res.memberships || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load current user:', err);
      removeStoredToken();
      setToken(null);
      setUser(null);
      setEmployee(null);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const loginWithOTP = async (mobileNumber: string, otp: string) => {
    setError(null);
    try {
      const res = await api.verifyOTP(mobileNumber, otp);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setMemberships(res.memberships || []);
      setEmployee(null);
    } catch (err: any) {
      setError(err.message || 'OTP Verification Failed');
      throw err;
    }
  };

  const loginStaff = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.loginStaff(email, password);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setEmployee(res.employee || null);
      setMemberships([]);
    } catch (err: any) {
      setError(err.message || 'Staff Login Failed');
      throw err;
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setEmployee(null);
    setMemberships([]);
  };

  const demoLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'CUSTOMER') {
        // Customer 1 (Mobile 9876543210 - match prompt example)
        await loginWithOTP('9876543210', '123456');
      } else if (role === 'CASHIER') {
        // Indian Oil Cashier
        await loginStaff('cashier.indianoil@platform.com', 'Password123!');
      } else if (role === 'BUSINESS_OWNER') {
        // Indian Oil Owner
        await loginStaff('owner@indianoil.com', 'Password123!');
      } else if (role === 'PLATFORM_ADMIN') {
        // Platform Admin
        await loginStaff('admin@platform.com', 'Password123!');
      } else if (role === 'BRANCH_MANAGER') {
        // Paradise Restaurant Cashier / Manager
        await loginStaff('cashier.paradise@platform.com', 'Password123!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        memberships,
        token,
        loading,
        error,
        loginWithOTP,
        loginStaff,
        logout,
        refreshUserData,
        demoLogin,
        getRedirectPathForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
