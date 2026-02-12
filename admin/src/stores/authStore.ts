import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'moderator';
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('adminToken'),

  login: async (email: string, password: string) => {
    try {
      // Call login API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      set({
        user: data.user,
        isAuthenticated: true,
        token: data.token,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    set({
      user: null,
      isAuthenticated: false,
      token: null,
    });
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  setToken: (token: string) => {
    localStorage.setItem('adminToken', token);
    set({ token, isAuthenticated: true });
  },
}));
