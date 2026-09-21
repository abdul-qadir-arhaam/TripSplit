import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginPayload, RegisterPayload, UserUpdatePayload } from '../features/auth/types';
import type { GuestSession, TripGuestConvertPayload, TripGuestConvertResponse } from '../features/trips/types';
import { authApi } from '../features/auth/api';
import { tripsApi } from '../features/trips/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UserUpdatePayload) => Promise<void>;
  logout: () => void;

  // Phase 4: Hybrid Membership
  guestSession: GuestSession | null;
  isGuest: boolean;
  setGuestSession: (session: GuestSession) => void;
  clearGuestSession: () => void;
  convertGuestSession: (tripId: string, payload: TripGuestConvertPayload) => Promise<TripGuestConvertResponse>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'trip_auth_token';
const USER_KEY = 'trip_auth_user';
const GUEST_SESSION_KEY = 'trip_guest_session';
const GUEST_TOKEN_KEY = 'trip_guest_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [guestSession, setGuestSessionState] = useState<GuestSession | null>(() => {
    const saved = localStorage.getItem(GUEST_SESSION_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state by validating token and fetching fresh user
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const freshUser = await authApi.getMe();
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      } catch {
        // Token was invalid or expired
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      // Clear any guest session on registered login
      localStorage.removeItem(GUEST_SESSION_KEY);
      localStorage.removeItem(GUEST_TOKEN_KEY);
      setGuestSessionState(null);
      setToken(response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      // Clear any guest session on registered account creation
      localStorage.removeItem(GUEST_SESSION_KEY);
      localStorage.removeItem(GUEST_TOKEN_KEY);
      setGuestSessionState(null);
      setToken(response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UserUpdatePayload) => {
    const updated = await authApi.updateProfile(payload);
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const setGuestSession = useCallback((session: GuestSession) => {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(GUEST_TOKEN_KEY, session.token);
    setGuestSessionState(session);
  }, []);

  const clearGuestSession = useCallback(() => {
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_TOKEN_KEY);
    setGuestSessionState(null);
  }, []);

  const convertGuestSession = useCallback(async (tripId: string, payload: TripGuestConvertPayload) => {
    setIsLoading(true);
    try {
      const res = await tripsApi.convertGuest(tripId, payload);
      // Seamlessly transition guest to full registered user session
      localStorage.removeItem(GUEST_SESSION_KEY);
      localStorage.removeItem(GUEST_TOKEN_KEY);
      setGuestSessionState(null);

      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user as User);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        guestSession,
        isGuest: !token && !!guestSession,
        setGuestSession,
        clearGuestSession,
        convertGuestSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

