"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMenuItems() {
  const { data, error, isLoading, mutate } = useSWR("/api/menu-items", fetcher);
  return {
    menuItems: data?.menuItems ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useMenuItem(id: string) {
  const { data, error, isLoading } = useSWR(`/api/menu-items/${id}`, fetcher);
  return { menuItem: data, isLoading, error };
}
