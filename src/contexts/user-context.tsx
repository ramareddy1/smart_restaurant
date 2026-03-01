"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const { user, isLoading, isError, mutate } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login when session is invalid (not loading, no user)
  useEffect(() => {
    if (!isLoading && !user && isError) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, isError, router, pathname]);

  return (
    <UserContext.Provider value={{ user, isLoading, mutate }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
