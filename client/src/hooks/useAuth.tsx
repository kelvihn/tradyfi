import { useState, useEffect, createContext, useContext, ReactNode } from "react";

// Define the auth context type
interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: null;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create a context for auth state
const AuthContext = createContext<AuthContextType | null>(null);

// Define props type for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Create the auth provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearAuth = () => {
    console.log('🧹 clearAuth called');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    console.log('🔍 fetchUser called, token exists:', !!token);
    console.log('🔍 Current isAuthenticated before fetch:', isAuthenticated);
    
    if (!token) {
      console.log('❌ No token, clearing auth');
      clearAuth();
      return;
    }

    setIsLoading(true);
    try {
      console.log('📡 Fetching user data...');
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status, response.ok);

      if (!response.ok) {
        console.log('❌ Auth response not ok:', response.status);
        if (response.status === 401) {
          localStorage.removeItem('token');
        }
        throw new Error('Authentication failed');
      }

      const userData = await response.json();
      console.log('✅ User data fetched:', userData);

      setUser(userData);
      setIsAuthenticated(true);
      console.log('✅ isAuthenticated set to TRUE');
      
    } catch (error) {
      console.error('❌ Auth fetch error:', error);
      localStorage.removeItem('token');
      clearAuth();
      console.log('❌ clearAuth called due to error');
    } finally {
      setIsLoading(false);
      console.log('🏁 fetchUser completed');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      clearAuth();
      window.location.href = '/';
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error: null,
    refetch: fetchUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}