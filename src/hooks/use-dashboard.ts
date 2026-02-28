"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  return {
    dashboard: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
