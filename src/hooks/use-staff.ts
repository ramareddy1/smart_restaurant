"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "KITCHEN_MANAGER" | "HEAD_CHEF" | "SERVER" | "HOST";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function useStaff(params?: {
  search?: string;
  role?: string;
  showInactive?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.role) searchParams.set("role", params.role);
  if (params?.showInactive) searchParams.set("showInactive", "true");

  const query = searchParams.toString();
  const url = `/api/staff${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    staff: (data?.items ?? []) as StaffMember[],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}
