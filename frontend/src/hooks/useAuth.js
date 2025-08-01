import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const queryClient = useQueryClient();

  // Verify token on app load
  const { isLoading: verifyingToken } = useQuery(
    'verify-token',
    () => authAPI.verify(),
    {
      enabled: !!token,
      onSuccess: (response) => {
        setUser(response.data.user);
      },
      onError: () => {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      },
      retry: false,
      staleTime: Infinity,
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    (credentials) => authAPI.login(credentials),
    {
      onSuccess: (response) => {
        const { user: userData, token: newToken } = response.data;
        
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(newToken);
        setUser(userData);
        
        toast.success('Giriş başarılı!');
        
        // Invalidate and refetch queries
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Giriş yapılırken hata oluştu';
        toast.error(message);
      },
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    (userData) => authAPI.register(userData),
    {
      onSuccess: (response) => {
        const { user: newUser, token: newToken } = response.data;
        
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        setToken(newToken);
        setUser(newUser);
        
        toast.success('Kayıt başarılı!');
        
        // Invalidate and refetch queries
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Kayıt olurken hata oluştu';
        toast.error(message);
      },
    }
  );

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    queryClient.clear();
    toast.success('Çıkış yapıldı');
  };

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;
  const isLoading = verifyingToken || loginMutation.isLoading || registerMutation.isLoading;

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoginLoading: loginMutation.isLoading,
    isRegisterLoading: registerMutation.isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }
    
    return <Component {...props} />;
  };
};

export default useAuth;