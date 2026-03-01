import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Not authenticated");
    return r.json();
  });

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "KITCHEN_MANAGER" | "HEAD_CHEF" | "SERVER" | "HOST";
  restaurantId: string;
};

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    user: data?.user as AuthUser | null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export async function loginUser(email: string, pin?: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pin: pin || null }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Login failed");
  }
  return res.json();
}

export async function logoutUser() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function pinSwitch(pin: string) {
  const res = await fetch("/api/auth/pin-switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "PIN switch failed");
  }
  return res.json();
}
