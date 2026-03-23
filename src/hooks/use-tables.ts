"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTables() {
  const { data, error, isLoading, mutate } = useSWR("/api/tables", fetcher, {
    refreshInterval: 30000,
  });

  return {
    tables: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useTable(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/tables/${id}` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  return {
    table: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
