import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Make sure to use the correct server URL
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        
        try {
          console.log(`Attempting login for ${email} to ${API_URL}/api/users/login`);
          
          const response = await axios.post(`/api/users/login`, {
            email,
            password,
          });
          
          const { user, token } = response.data;
          console.log('Login successful:', user);
          
          // Configure axios to use auth token for subsequent requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          set({ isLoading: false });
          console.error('Login error:', error.response?.data || error.message);
          throw new Error(
            error.response?.data?.message || 'Login failed. Please try again.'
          );
        }
      },
      
      // For demo purposes, add a quick login method
      demoLogin: async () => {
        set({ isLoading: true });
        
        try {
          const response = await axios.post(`/api/users/login`, {
            email: 'demo@example.com',
            password: 'password',
          });
          
          const { user, token } = response.data;
          
          // Configure axios to use auth token for subsequent requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          set({ isLoading: false });
          console.error('Demo login error:', error);
          return false;
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true });
        
        try {
          console.log('Sending registration request to:', `${API_URL}/api/users/register`);
          
          const response = await axios.post(`/api/users/register`, userData);
          
          const { user, token } = response.data;
          console.log('Registration successful:', user);
          
          // Configure axios to use auth token for subsequent requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          set({ isLoading: false });
          console.error('Register error details:', error.response?.data || error.message);
          throw new Error(
            error.response?.data?.message || 'Registration failed. Please try again.'
          );
        }
      },
      
      logout: () => {
        // Remove auth token from axios
        delete axios.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      
      updateUser: (userData) => {
        set({
          user: { ...get().user, ...userData },
        });
      },
      
      // Initialize authentication from token
      initAuth: () => {
        const { token } = get();
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);
