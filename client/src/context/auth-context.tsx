import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const result = await api.getCurrentUser();
        return result.user;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const user = data ?? null;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  const login = async (email: string, password: string): Promise<User> => {
    const result = await api.login(email, password);
    queryClient.setQueryData(["currentUser"], result.user);
    return result.user;
  };

  const register = async (data: any): Promise<User> => {
    const result = await api.register(data);
    await login(data.email, data.password);
    return result.user;
  };

  const logout = async () => {
    await api.logout();
    queryClient.setQueryData(["currentUser"], null);
    queryClient.invalidateQueries();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
