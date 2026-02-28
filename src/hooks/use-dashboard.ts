"use client";

import useSWR from "swr";
import { DASHBOARD_REFRESH_MS } from "@/lib/constants";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: DASHBOARD_REFRESH_MS,
    refreshWhenHidden: false, // Don't refresh when tab is in background
    refreshWhenOffline: false, // Don't refresh when offline
  });

  return {
    dashboard: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
