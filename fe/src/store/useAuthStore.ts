import { create } from 'zustand';
import { urbanTreeApi } from '../api/urbanTreeApi';
import type { UserInfo } from '../api/urbanTreeApi';

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, otp: string) => Promise<UserInfo>;
  loginAsAdmin: () => Promise<UserInfo>;
  logout: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  login: async (email, otp) => {
    set({ loading: true });
    try {
      const userInfo = await urbanTreeApi.verifyOtp(email, otp);
      localStorage.setItem('user', JSON.stringify(userInfo));
      set({ user: userInfo, loading: false });
      return userInfo;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  loginAsAdmin: async () => {
    set({ loading: true });
    try {
      const userInfo = await urbanTreeApi.loginAsAdmin();
      localStorage.setItem('user', JSON.stringify(userInfo));
      set({ user: userInfo, loading: false });
      return userInfo;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await urbanTreeApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('user');
    set({ user: null, loading: false });
  },
  checkUser: async () => {
    try {
      const loggedUserEmail = await urbanTreeApi.getCurrentUser();
      if (!loggedUserEmail || loggedUserEmail === 'Guest') {
        localStorage.removeItem('user');
        set({ user: null });
      }
    } catch {
      localStorage.removeItem('user');
      set({ user: null });
    }
  }
}));
