// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: 'ADMIN' | 'LECTURER';
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, name: string, role?: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ 
              user: data.user,
              isAuthenticated: true
            });
            return true;
          }
          return false;
        } catch {
          console.error('Login error');
          return false;
        }
      },

      register: async (username: string, password: string, name: string, role = 'LECTURER') => {
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, name, role }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ 
              user: data.user,
              isAuthenticated: true
            });
            return true;
          }
          return false;
        } catch {
          console.error('Register error');
          return false;
        }
      },

      logout: () => {
        // เรียก logout API เพื่อลบ cookie
        fetch('/api/auth/logout', {
          method: 'POST',
        }).catch(console.error);
        
        set({ 
          user: null,
          isAuthenticated: false
        });
      },

      setUser: (user: User) => {
        set({ 
          user,
          isAuthenticated: true
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
