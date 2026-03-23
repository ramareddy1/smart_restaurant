"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useServerDashboard() {
  const { data, error, isLoading } = useSWR(
    "/api/server/dashboard",
    fetcher,
    { refreshInterval: 15000 }
  );

  return {
    dashboard: data,
    isLoading,
    isError: !!error,
  };
}
