import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, getRedirectPathForRole } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { CashierDashboard } from './pages/CashierDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

import { ArchitectureDocPage } from './pages/ArchitectureDocPage';
import { ClientDiscoveryPage } from './pages/ClientDiscoveryPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  // Handle URL history state & sync
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Automatic redirect according to role after authentication!
  useEffect(() => {
    if (!loading && user) {
      if (currentPath === '/login' || currentPath === '/') {
        const target = getRedirectPathForRole(user.role);
        navigateTo(target);
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Loyalty SaaS Platform...
          </p>
        </div>
      </div>
    );
  }

  const renderRoute = () => {
    // Basic route matching
    if (currentPath === '/') {
      return <LandingPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/architecture') {
      return <ArchitectureDocPage />;
    }
    if (currentPath === '/discovery' || currentPath === '/questionnaire') {
      return <ClientDiscoveryPage />;
    }
    if (currentPath.startsWith('/customer')) {
      if (!user) return <LoginPage onNavigate={navigateTo} />;
      return <CustomerDashboard />;
    }
    if (currentPath.startsWith('/cashier')) {
      if (!user) return <LoginPage onNavigate={navigateTo} />;
      return <CashierDashboard />;
    }
    if (currentPath.startsWith('/merchant')) {
      if (!user) return <LoginPage onNavigate={navigateTo} />;
      return <MerchantDashboard />;
    }
    if (currentPath.startsWith('/admin')) {
      if (!user) return <LoginPage onNavigate={navigateTo} />;
      return <AdminDashboard />;
    }

    // Default Fallback
    return <LandingPage onNavigate={navigateTo} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased">
      <Navbar currentPath={currentPath} onNavigate={navigateTo} />
      <main className="flex-1">{renderRoute()}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
