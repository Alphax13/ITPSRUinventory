// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STAFF' | 'LECTURER';
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string) => {
        try {
          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
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

      logout: () => {
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
