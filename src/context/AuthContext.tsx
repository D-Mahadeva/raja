import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useShop } from './ShopContext';

// Define types
interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkUserExists: (email: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get API URL
const getApiUrl = () => {
  const possibleUrls = [
    import.meta.env.VITE_API_URL?.replace('/products', ''),
    'http://localhost:5000/api',
    'http://192.168.1.35:5000/api',
    `http://${window.location.hostname}:5000/api`,
  ];

  for (const url of possibleUrls) {
    if (url) return url;
  }
  
  return 'http://localhost:5000/api';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { clearCart, loadUserCart } = useShop();
  
  // API endpoint base
  const API_URL = getApiUrl();

  useEffect(() => {
    // Check if user is already logged in (from localStorage token)
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          setIsLoading(true);
          const response = await axios.get(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setUser(response.data);
          
          // Load user's cart from server
          await loadUserCart();
        } catch (error) {
          console.error('Authentication error:', error);
          localStorage.removeItem('auth_token');
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Check if user exists
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/users/check`, { email });
      return response.data.exists;
    } catch (error) {
      console.error('Error checking user:', error);
      throw new Error('Failed to check if user exists');
    }
  };
  
  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post(`${API_URL}/users/login`, { email, password });
      
      // Save token to localStorage
      localStorage.setItem('auth_token', response.data.token);
      
      // Update user state
      setUser(response.data.user);
      
      // Load user's cart from server
      await loadUserCart();
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid credentials');
      }
      throw new Error('Login failed. Please try again.');
    }
  };
  
  // Signup function
  const signup = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post(`${API_URL}/users/signup`, { email, password });
      
      // Save token to localStorage
      localStorage.setItem('auth_token', response.data.token);
      
      // Update user state
      setUser(response.data.user);
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Email already in use');
      }
      throw new Error('Signup failed. Please try again.');
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Remove token from localStorage
      localStorage.removeItem('auth_token');
      
      // Clear user state
      setUser(null);
      
      // Clear cart
      clearCart();
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  };
  
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    checkUserExists,
    login,
    signup,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};