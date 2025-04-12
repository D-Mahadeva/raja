// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  // Try different possible API URL sources
  const envApiUrl = import.meta.env.VITE_API_URL?.replace('/products', '');
  const currentOrigin = window.location.origin;
  const possibleUrls = [
    envApiUrl,
    `${currentOrigin}/api`,
    'http://localhost:5000/api',
    `http://${window.location.hostname}:5000/api`,
  ];
  
  // Filter out undefined/null values
  return possibleUrls.find(url => url) || 'http://localhost:5000/api';
};

// Create a robust API client with retries and timeouts
const createApiClient = () => {
  const client = axios.create({
    baseURL: getApiUrl(),
    timeout: 10000, // 10 second timeout
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  // Add response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    async error => {
      // Get original request
      const originalRequest = error.config;
      
      // If we've already tried 3 times, give up
      if (originalRequest._retry >= 3) {
        return Promise.reject(error);
      }
      
      // If the error is a network error or a timeout, retry
      if (error.code === 'ECONNABORTED' || 
          error.message?.includes('timeout') || 
          !error.response) {
        // Increment retry count
        originalRequest._retry = (originalRequest._retry || 0) + 1;
        
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * originalRequest._retry));
        
        // Try an alternative URL if we have one
        if (originalRequest._retry > 1) {
          const altUrls = [
            'http://localhost:5000/api',
            `http://${window.location.hostname}:5000/api`
          ];
          
          originalRequest.baseURL = altUrls[originalRequest._retry - 2] || originalRequest.baseURL;
          console.log(`Retrying with alternative URL: ${originalRequest.baseURL}`);
        }
        
        console.log(`Retrying request (attempt ${originalRequest._retry})`);
        return client(originalRequest);
      }
      
      return Promise.reject(error);
    }
  );
  
  return client;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { clearCart, loadUserCart } = useShop();
  
  // Use refs to track operational states and prevent race conditions
  const userRef = useRef<User | null>(null);
  const isLoadingRef = useRef<boolean>(true);
  const loginLoadCartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialAuthCheckRef = useRef<boolean>(true);
  
  // Initialize API client
  const apiClient = React.useMemo(() => createApiClient(), []);

  useEffect(() => {
    // Check if user is already logged in (from localStorage token)
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          setIsLoading(true);
          isLoadingRef.current = true;
          
          let userResponse = null;
          
          // Try different endpoints to verify the token
          const endpoints = [
            `${getApiUrl()}/users/me`,
            'http://localhost:5000/api/users/me',
            `http://${window.location.hostname}:5000/api/users/me`
          ];
          
          for (const endpoint of endpoints) {
            try {
              console.log(`Trying to authenticate with ${endpoint}`);
              userResponse = await axios.get(endpoint, {
                headers: {
                  Authorization: `Bearer ${token}`
                },
                timeout: 8000
              });
              
              if (userResponse.data) {
                console.log(`Successfully authenticated with ${endpoint}`);
                break;
              }
            } catch (err) {
              console.error(`Failed to authenticate with ${endpoint}:`, err);
              // Continue to next endpoint
            }
          }
          
          if (userResponse?.data) {
            console.log('Authentication successful, updating user state');
            setUser(userResponse.data);
            userRef.current = userResponse.data;
            
            // Load user's cart from server with small delay to ensure products are loaded
            if (loginLoadCartTimeoutRef.current) {
              clearTimeout(loginLoadCartTimeoutRef.current);
            }
            
            // Only do this on initial auth check
            if (isInitialAuthCheckRef.current) {
              isInitialAuthCheckRef.current = false;
              
              loginLoadCartTimeoutRef.current = setTimeout(() => {
                console.log('Delayed cart load after initial authentication');
                loadUserCart();
                loginLoadCartTimeoutRef.current = null;
              }, 3000); // 3 second delay
            }
          } else {
            // No valid response from any endpoint
            console.log('Authentication failed, clearing token');
            localStorage.removeItem('auth_token');
            setUser(null);
            userRef.current = null;
          }
        } catch (error) {
          console.error('Authentication error:', error);
          localStorage.removeItem('auth_token');
          setUser(null);
          userRef.current = null;
        } finally {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      } else {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    checkAuth();
    
    // Cleanup function to clear any pending timeouts
    return () => {
      if (loginLoadCartTimeoutRef.current) {
        clearTimeout(loginLoadCartTimeoutRef.current);
      }
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, [loadUserCart]);
  
  // Check if user exists
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      console.log('Checking if user exists:', email);
      
      // Try multiple endpoints to check if the user exists
      const endpoints = [
        `${getApiUrl()}/users/check`,
        'http://localhost:5000/api/users/check',
        `http://${window.location.hostname}:5000/api/users/check`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await axios.post(endpoint, 
            { email }, 
            {
              timeout: 8000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`Response from ${endpoint}:`, response.data);
          return response.data.exists;
        } catch (err) {
          console.error(`Failed to check user with ${endpoint}:`, err);
          // Continue to next endpoint
        }
      }
      
      // If we've tried all endpoints and still failed, try directly with fetch API
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
          });
          
          if (response.ok) {
            const data = await response.json();
            return data.exists;
          }
        } catch (err) {
          console.error(`Fetch API failed with ${endpoint}:`, err);
          // Continue to next endpoint
        }
      }
      
      // If all attempts fail, assume this is a new user
      console.warn('All user check attempts failed, assuming new user');
      return false;
    } catch (error) {
      console.error('Final error checking user:', error);
      throw new Error('Failed to check if user exists');
    }
  };
  
  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting login for:', email);
      
      // Try multiple endpoints for login
      const endpoints = [
        `${getApiUrl()}/users/login`,
        'http://localhost:5000/api/users/login',
        `http://${window.location.hostname}:5000/api/users/login`
      ];
      
      let loginResponse = null;
      let loginError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying login with endpoint: ${endpoint}`);
          loginResponse = await axios.post(endpoint, 
            { email, password }, 
            { 
              timeout: 8000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (loginResponse.data && loginResponse.data.token) {
            console.log(`Login successful with ${endpoint}`);
            break;
          }
        } catch (err: any) {
          console.error(`Login failed with ${endpoint}:`, err);
          
          // If we get a 401, don't try other endpoints
          if (err.response?.status === 401) {
            loginError = err;
            break;
          }
          
          loginError = err;
          // Continue to next endpoint
        }
      }
      
      // If no successful response, try with fetch API
      if (!loginResponse) {
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
            });
            
            // Check for 401 Unauthorized
            if (response.status === 401) {
              throw new Error('Invalid credentials');
            }
            
            if (response.ok) {
              loginResponse = { data: await response.json() };
              console.log(`Login successful with fetch API at ${endpoint}`);
              break;
            }
          } catch (err: any) {
            console.error(`Fetch login failed with ${endpoint}:`, err);
            loginError = err;
            
            // If this is an invalid credentials error, stop trying
            if (err.message === 'Invalid credentials') {
              break;
            }
            // Continue to next endpoint
          }
        }
      }
      
      // Check if we have a successful login
      if (loginResponse?.data?.token) {
        // Save token to localStorage
        localStorage.setItem('auth_token', loginResponse.data.token);
        
        // Update user state
        setUser(loginResponse.data.user);
        userRef.current = loginResponse.data.user;
        
        // Load user's cart from server with a proper delay
        if (loginLoadCartTimeoutRef.current) {
          clearTimeout(loginLoadCartTimeoutRef.current);
        }
        
        // Use a longer delay to ensure everything is ready
        loginLoadCartTimeoutRef.current = setTimeout(() => {
          console.log('Delayed cart load after login');
          loadUserCart();
          loginLoadCartTimeoutRef.current = null;
        }, 3000); // 3 second delay
      } else {
        // We couldn't log in with any endpoint
        if (loginError?.response?.status === 401 || 
            loginError?.message === 'Invalid credentials') {
          throw new Error('Invalid credentials');
        } else {
          throw new Error('Login failed. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401 || error.message === 'Invalid credentials') {
        throw new Error('Invalid credentials');
      }
      
      throw new Error('Login failed. Please try again.');
    }
  };
  
  // Signup function
  const signup = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting signup for:', email);
      
      // Try multiple endpoints for signup
      const endpoints = [
        `${getApiUrl()}/users/signup`,
        'http://localhost:5000/api/users/signup',
        `http://${window.location.hostname}:5000/api/users/signup`
      ];
      
      let signupResponse = null;
      let signupError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying signup with endpoint: ${endpoint}`);
          signupResponse = await axios.post(endpoint, 
            { email, password }, 
            { 
              timeout: 8000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`Signup response from ${endpoint}:`, signupResponse.data);
          
          if (signupResponse.data && signupResponse.data.token) {
            break;
          }
        } catch (err: any) {
          console.error(`Signup failed with ${endpoint}:`, err);
          
          // If we get a 409 (conflict), the email is already in use
          if (err.response?.status === 409) {
            signupError = err;
            break;
          }
          
          signupError = err;
          // Continue to next endpoint
        }
      }
      
      // If no successful response, try with fetch API
      if (!signupResponse) {
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
            });
            
            // Check for 409 Conflict (email already exists)
            if (response.status === 409) {
              throw new Error('Email already in use');
            }
            
            if (response.ok) {
              signupResponse = { data: await response.json() };
              break;
            }
          } catch (err: any) {
            console.error(`Fetch signup failed with ${endpoint}:`, err);
            signupError = err;
            
            // If this is an email already in use error, stop trying
            if (err.message === 'Email already in use') {
              break;
            }
            // Continue to next endpoint
          }
        }
      }
      
      // Check if we have a successful signup
      if (signupResponse?.data?.token) {
        // Save token to localStorage
        localStorage.setItem('auth_token', signupResponse.data.token);
        
        // Update user state
        setUser(signupResponse.data.user);
        userRef.current = signupResponse.data.user;
        
        // Don't load cart after signup - it will be empty
      } else {
        // We couldn't sign up with any endpoint
        if (signupError?.response?.status === 409 || 
            signupError?.message === 'Email already in use') {
          throw new Error('Email already in use');
        } else {
          throw new Error('Signup failed. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.response?.status === 409 || error.message === 'Email already in use') {
        throw new Error('Email already in use');
      }
      
      throw new Error('Signup failed. Please try again.');
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Clear any pending operations
      if (loginLoadCartTimeoutRef.current) {
        clearTimeout(loginLoadCartTimeoutRef.current);
        loginLoadCartTimeoutRef.current = null;
      }
      
      // Remove token from localStorage
      localStorage.removeItem('auth_token');
      
      // Clear user state
      setUser(null);
      userRef.current = null;
      
      // Clear cart
      clearCart();
      
      console.log('Logout successful');
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

export default AuthContext;