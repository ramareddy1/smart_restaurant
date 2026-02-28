"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMenus(params?: { search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const url = `/api/menus${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    menus: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useMenu(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/menus/${id}` : null,
    fetcher
  );

  return {
    menu: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useMenuItems(params?: { search?: string; category?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.category) searchParams.set("category", params.category);

  const query = searchParams.toString();
  const url = `/api/menu-items${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    menuItems: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useAllMenuItems() {
  const { data, error, isLoading } = useSWR("/api/menu-items?pageSize=1000", fetcher);

  return {
    menuItems: data?.items ?? [],
    isLoading,
    isError: !!error,
  };
}
