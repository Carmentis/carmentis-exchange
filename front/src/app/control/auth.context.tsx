'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useControlAuth } from '@/hooks/useControlAuth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  publicKey: string | null;
  loading: boolean;
  error: Error | null;
  login: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useControlAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    // Set initialization flag after auth state is loaded from localStorage
    setIsInitialized(true);
  }, []);

  // Redirect to login page if not authenticated
  useEffect(() => {
    if (isInitialized && !auth.isAuthenticated && window.location.pathname !== '/control') {
      router.push('/control');
    }
  }, [isInitialized, auth.isAuthenticated, router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: auth.isAuthenticated,
        publicKey: auth.publicKey,
        loading: auth.loading,
        error: auth.error,
        login: auth.login,
        logout: auth.logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}