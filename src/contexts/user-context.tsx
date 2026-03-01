"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCurrentUser, type AuthUser } from "@/hooks/use-auth";

interface UserContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  mutate: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: true,
  mutate: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, mutate } = useCurrentUser();

  return (
    <UserContext.Provider value={{ user, isLoading, mutate }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
